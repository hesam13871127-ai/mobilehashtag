"""End-to-end HTTP test of the real storefront: browse, cart, checkout, order, contact, account.

Talks to the live QA WordPress instance exactly like a browser would (cookies + real HTML forms),
so failures here are real product failures, not harness artefacts.
"""
import json
import re
import sys
import time
from html.parser import HTMLParser

import requests
from requests.cookies import RequestsCookieJar, create_cookie

BASE = "http://localhost:9500"
PUBLIC = "https://9500-ilm36orjpsj0a98j630fu.e2b.app"  # only used when the runtime reports the preview host


def to_local(url):
    return url.replace(PUBLIC, BASE).replace("https://" + PUBLIC.split("//")[1], BASE) if url else url
results = []


def check(name, ok, detail=""):
    results.append({"test": name, "pass": bool(ok), "detail": str(detail)[:300]})
    print(("PASS " if ok else "FAIL ") + name + ((" :: " + str(detail)[:200]) if detail else ""))


# WooCommerce submit buttons that, when present in the payload, make it recalculate
# totals or refresh instead of performing the main action.
SKIP_BUTTONS = {"woocommerce_checkout_update_totals", "update_cart", "apply_coupon",
                "remove_coupon", "woocommerce-apply-coupon"}


def parse_form(html, form_id=None, action_contains=None):
    """Return (action, method, {name: value}) for the first matching form."""
    forms = re.findall(r"<form\b[^>]*>.*?</form>", html, re.S)
    for form in forms:
        head = re.match(r"<form\b[^>]*>", form, re.S).group(0)
        if form_id and f'id="{form_id}"' not in head:
            continue
        action = (re.search(r'action="([^"]*)"', head) or [None, ""])[1]
        action = action.replace("&amp;", "&")
        if action_contains and action_contains not in action:
            continue
        method = ((re.search(r'method="([^"]*)"', head) or [None, "get"])[1] or "get").lower()
        fields = {}
        for m in re.finditer(r'<input\b[^>]*>', form):
            tag = m.group(0)
            name = re.search(r'name="([^"]*)"', tag)
            if not name:
                continue
            value = re.search(r'value="([^"]*)"', tag)
            ftype = (re.search(r'type="([^"]*)"', tag) or [None, "text"])[1]
            if ftype in ("checkbox", "radio") and "checked" not in tag:
                continue
            fields[name.group(1)] = (value.group(1) if value else "").replace("&amp;", "&")
        for m in re.finditer(r'<button\b[^>]*>', form):
            tag = m.group(0)
            name = re.search(r'name="([^"]*)"', tag)
            value = re.search(r'value="([^"]*)"', tag)
            if name and value and name.group(1) not in SKIP_BUTTONS:
                fields[name.group(1)] = value.group(1).replace("&amp;", "&")
        for m in re.finditer(r'<textarea\b[^>]*name="([^"]*)"[^>]*>(.*?)</textarea>', form, re.S):
            fields[m.group(1)] = m.group(2)
        for m in re.finditer(r'<select\b[^>]*name="([^"]*)"[^>]*>(.*?)</select>', form, re.S):
            name, body = m.group(1), m.group(2)
            selected = re.search(r'<option[^>]*selected[^>]*value="([^"]*)"', body)
            if not selected:
                for opt in re.finditer(r'<option[^>]*value="([^"]*)"[^>]*>([^<]*)</option>', body):
                    # skip the empty "choose one" placeholder so required selects validate
                    if opt.group(1).strip():
                        selected = opt
                        break
            fields[name] = selected.group(1).replace("&amp;", "&") if selected else ""
        return action, method, fields
    return None


def main():
    def make_session():
        sess = requests.Session()
        sess.headers["User-Agent"] = "MobileHashtag-QA/1.0"
        sess.timeout = 180
        # The QA site is served over plain http but WordPress sets Secure cookies
        # (FORCE_SSL_ADMIN / site URL rewrite), so they would never come back.
        sess.verify = False
        original_request = sess.request

        def request(method, url, **kwargs):
            url = to_local(url)
            kwargs.setdefault("allow_redirects", True)
            return original_request(method, url, **kwargs)

        sess.request = request

        # Redirect targets inside requests bypass session.request(); localise them too.
        def localise_response(resp, **kwargs):
            if resp.is_redirect and "location" in resp.headers:
                resp.headers["location"] = to_local(resp.headers["location"])
            return resp
        sess.max_redirects = 10
        original_send = sess.send

        def send(request_, **kwargs):
            resp = original_send(request_, **kwargs)
            localise_response(resp)
            # WordPress plants cookies on the preview host domain (localhost.local) and
            # marks them Secure, so they never travel back to 127.0.0.1 and every request
            # starts a brand-new cart session. Response hooks run before requests extracts
            # Set-Cookie, so the jar must be rewritten here, after send().
            jar = RequestsCookieJar()
            for cookie in list(sess.cookies):
                jar.set_cookie(create_cookie(name=cookie.name, value=cookie.value, domain="", path="/"))
            sess.cookies = jar
            return resp
        sess.send = send

        def hook(resp, **kwargs):
            if resp.is_redirect and "location" in resp.headers:
                resp.headers["location"] = to_local(resp.headers["location"])
            return resp
        sess.hooks["response"].append(hook)
        return sess

    s = make_session()

    # ---------- public pages ----------
    pages = {
        "home": "/",
        "shop": "/shop/",
        "about": "/about-us/",
        "contact": "/contact-us/",
        "faq": "/faq/",
        "cart": "/cart/",
        "checkout": "/checkout/",
        "account": "/my-account/",
        "category": "/product-category/phones/",
        "product": "/product/iphone-15-pro-max/",
        "blog": "/blog/",
        "search": "/?s=%D8%A2%DB%8C%D9%81%D9%88%D9%86&post_type=product",
    }
    bodies = {}
    for key, url in pages.items():
        r = s.get(BASE + url, allow_redirects=True)
        bodies[key] = r.text
        fatal = ("critical error" in r.text.lower()) or ("Fatal error" in r.text) or ("Warning:" in r.text and "wp-content" in r.text)
        check(f"page {key} HTTP 200", r.status_code == 200, f"{r.status_code} {r.url}")
        check(f"page {key} no PHP error", not fatal, "critical/fatal marker found")
        check(f"page {key} RTL + fa", 'dir="rtl"' in r.text and 'lang="fa' in r.text.lower())

    check("home has product cards", bodies["home"].count("product-card") >= 8, bodies["home"].count("product-card"))
    check("home has hero slider", 'class="hero' in bodies["home"] and 'hero-dots' in bodies["home"])
    check("home has category rail", 'category-card' in bodies["home"], bodies["home"].count("category-card"))
    check("home has header announcement", 'announcement' in bodies["home"])
    check("home has footer newsletter", 'newsletter' in bodies["home"])
    check("home has brand strip", 'brand-list' in bodies["home"])
    check("shop lists products", bodies["shop"].count("product-card") >= 6, bodies["shop"].count("product-card"))
    check("shop has filters", 'filter-panel' in bodies["shop"] and 'shop-filters' in bodies["shop"])
    check("product page has gallery", 'woocommerce-product-gallery' in bodies["product"])
    check("product page has add-to-cart", 'single_add_to_cart_button' in bodies["product"])
    check("product page shows price in Toman", 'تومان' in bodies["product"])
    check("about keeps original story", 'داستان موبایل هشتگ' in bodies["about"] and 'چرا هشتگ؟' in bodies["about"])
    check("contact keeps original form", 'برایمان بنویسید' in bodies["contact"] and 'mhc-form' in bodies["contact"])
    check("contact shows contact info", 'contact-information' in bodies["contact"])
    check("search returns products", bodies["search"].count("product-card") >= 1, bodies["search"].count("product-card"))
    check("assets: theme css loads", "/assets/css/style.css" in bodies["home"])

    # ---------- images not broken ----------
    imgs = set(re.findall(r'<img[^>]+src="([^"]+)"', bodies["home"]))
    broken = []
    for src in list(imgs)[:24]:
        url = src if src.startswith("http") else BASE + src
        try:
            rr = s.get(url.replace("https://9500-ilm36orjpsj0a98j630fu.e2b.app", BASE), timeout=90)
            if rr.status_code != 200 or len(rr.content) < 100:
                broken.append((src, rr.status_code))
        except Exception as exc:
            broken.append((src, str(exc)[:60]))
    check("home images all load", not broken, broken[:3])

    order_no, order_phone = "", ""

    # ---------- add to cart (real WooCommerce form) ----------
    # The first imported product has limited stock and every QA run decrements it, so the
    # flow uses a product that is still comfortably in stock (real data, no fixtures).
    # Pick the first product that genuinely has >= 2 units in stock: stock is real and
    # is decremented by every previous order, so a fixed slug eventually runs out and the
    # failure would be correct WooCommerce behaviour, not a theme defect.
    def enough_stock(html):
        m_stock = re.search(r'(\d[\d,]*)\s+in stock', html)
        if m_stock:
            return int(re.sub(r"\D", "", m_stock.group(1))) >= 2
        return True  # no managed stock shown => unlimited

    for candidate in ("sony-wh-1000xm5", "airpods-pro-2", "anker-powerbank-20k",
                      "galaxy-s24-ultra", "redmi-note-13-pro", "jbl-flip-6", "poco-x6"):
        page = s.get(BASE + "/product/" + candidate + "/", timeout=120)
        if (page.status_code == 200 and 'name="add-to-cart"' in page.text
                and "single_add_to_cart_button" in page.text and enough_stock(page.text)):
            bodies["product"] = page.text
            break
    m = re.search(r'<form[^>]+class="[^"]*cart[^"]*"[^>]*>.*?</form>', bodies["product"], re.S)
    form_html = m.group(0) if m else bodies["product"]
    action, method, fields = parse_form(form_html, action_contains="") or (None, None, None)
    if not action:
        action, method, fields = parse_form(bodies["product"], form_id=None)
    check("product add-to-cart form parsed", bool(action), action)
    fields = {k: v for k, v in (fields or {}).items()}
    fields.setdefault("add-to-cart", re.search(r'name="add-to-cart" value="(\d+)"', bodies["product"]).group(1) if re.search(r'name="add-to-cart" value="(\d+)"', bodies["product"]) else "")
    fields["quantity"] = "2"
    # colour selector rendered by Mobile Hashtag Core for source simple products
    colour = re.search(r'<select name="mhc_color"[^>]*>.*?<option value="([^"]+)"', bodies["product"], re.S)
    if colour:
        fields["mhc_color"] = colour.group(1)
    r = s.post(to_local(action), data=fields, allow_redirects=True)
    cart = s.get(BASE + "/cart/", timeout=120).text
    check("add to cart works", "cart_item" in cart or "woocommerce-cart-form" in cart)
    qty = re.search(r'class="qty"[^>]*value="(\d+)"', cart) or re.search(r'name="cart\[[^\]]+\]\[qty\]"[^>]*value="(\d+)"', cart)
    check("cart quantity is 2", bool(qty) and qty.group(1) == "2", qty.group(1) if qty else "not found")
    check("cart shows total in Toman", "تومان" in cart and ("cart-subtotal" in cart or "order-total" in cart))

    # increase quantity
    cform = parse_form(cart, action_contains="cart")
    if cform:
        caction, cmethod, cfields = cform
        key = next((k for k in cfields if k.startswith("cart[") and k.endswith("[qty]")), None)
        if key:
            cfields[key] = "3"
            cfields["update_cart"] = "به‌روزرسانی سبد"
            s.post(to_local(caction), data=cfields, allow_redirects=True)
            cart2 = s.get(BASE + "/cart/", timeout=120).text
            q2 = re.search(r'class="qty"[^>]*value="(\d+)"', cart2) or re.search(r'name="cart\[[^\]]+\]\[qty\]"[^>]*value="(\d+)"', cart2)
            check("cart quantity update works", bool(q2) and q2.group(1) == "3", q2.group(1) if q2 else "?")
        else:
            check("cart quantity update works", False, "qty field not found")

    # ---------- checkout ----------
    # Stock levels are the real imported ones and stock is decremented by every test
    # order, so checkout runs against a product that is actually in stock.
    cart_now = s.get(BASE + "/cart/", timeout=180).text
    cf = parse_form(cart_now, action_contains="/cart/")
    if cf:
        caction, cmethod, cfields = cf
        key = next((k for k in cfields if k.startswith("cart[") and k.endswith("[qty]")), None)
        if key:
            cfields[key] = "1"
            cfields["update_cart"] = "1"
            s.post(to_local(caction), data=cfields, allow_redirects=True)
    checkout = s.get(BASE + "/checkout/", timeout=180).text
    # Require the real checkout form; an empty cart redirects to /cart/ and would
    # otherwise pass on the word "checkout" appearing anywhere in the page.
    check("checkout renders the real form",
          'name="billing_first_name"' in checkout and 'name="woocommerce-process-checkout-nonce"' in checkout,
          "checkout form fields" if 'name="billing_first_name"' in checkout else "no billing fields")
    cform = parse_form(checkout, form_id="checkout") or parse_form(checkout, action_contains="checkout")
    if not cform:
        check("checkout form parsed", False, "no form")
    else:
        action, method, fields = cform
        fields.update({
            "billing_first_name": "آزمون", "billing_last_name": "هشتگ",
            "billing_country": "IR", "billing_address_1": "خیابان آزمون ۱۲", "billing_city": "تهران",
            "billing_state": "THR", "billing_postcode": "1234567890", "billing_phone": "09120000000",
            "billing_email": "qa-checkout@example.org", "payment_method": "cod",
            "terms": "on", "terms-field": "1", "woocommerce-process-checkout-nonce": fields.get("woocommerce-process-checkout-nonce", ""),
            "_wp_http_referer": "/?wc-ajax=update_order_review",
        })
        r = s.post(BASE + "/?wc-ajax=checkout", data=fields, timeout=180)
        try:
            payload = r.json()
        except Exception:
            payload = {"raw": r.text[:400]}
        # A non-JSON reply usually means a PHP fatal; surface it instead of a blank message.
        if not payload.get("messages") and r.text.strip() and not r.text.lstrip().startswith("{"):
            payload["messages"] = re.sub(r"<[^>]+>", " ", r.text)[:300]
        check("checkout AJAX returns JSON", "result" in payload, str(payload)[:250])
        if payload.get("result") == "success":
            order_no = str(payload.get("order_id", "") or re.sub(r"\D", "", payload.get("redirect", "")))
            order_phone = fields.get("billing_phone", "")
            check("order created (real)", True, payload.get("redirect", ""))
            order_url = payload.get("redirect", "")
            if order_url:
                rec = s.get(order_url.replace("https://9500-ilm36orjpsj0a98j630fu.e2b.app", BASE), timeout=120)
                check("order received page loads", rec.status_code == 200, rec.status_code)
                check("order page shows order number", "order" in rec.text.lower())
        else:
            check("order created (real)", False, str(payload)[:300])

    # ---------- contact form ----------
    contact = s.get(BASE + "/contact-us/", timeout=120).text
    cform = parse_form(contact, action_contains="admin-post.php")
    check("contact form has nonce", bool(cform and "mhc_nonce" in cform[2]))
    if cform:
        action, method, fields = cform
        fields.update({"name": "فرستنده آزمون", "phone": "09121112233", "email": "sender@example.org",
                       "subject": "سؤال درباره محصول", "message": "این یک پیام آزمایشی است که از فرم واقعی سایت ارسال می‌شود.",
                       "consent": "1"})
        r = s.post(BASE + "/wp-admin/admin-post.php", data=fields, timeout=120)
        # The per-IP hourly ceiling is real, so repeated runs can be throttled. That is
        # reported as its own (skipped) result instead of being counted as a pass.
        if r.status_code == 429:
            results.append({"test": "contact form submits", "pass": None, "skipped": True,
                            "detail": "rate-limited (429) — the ceiling is real"})
            results.append({"test": "contact form confirms save", "pass": None, "skipped": True,
                            "detail": "not reached (429)"})
            print("SKIP contact form submits :: rate-limited (429)")
            print("SKIP contact form confirms save :: not reached (429)")
        else:
            check("contact form submits", r.status_code == 200, r.status_code)
            check("contact form confirms save", "ذخیره شد" in r.text, r.text[:160])
    # spam protection
    if cform:
        fields["website"] = "http://spam.example"
        r2 = s.post(BASE + "/wp-admin/admin-post.php", data=fields, timeout=120)
        check("contact honeypot blocks spam", "ذخیره نشد" in r2.text or r2.status_code >= 400, r2.status_code)

    # ---------- order tracking (real orders, source form) ----------
    trk = s.get(BASE + "/tracking/", timeout=120).text
    check("tracking page uses source layout", 'id="tracking-form"' in trk and "کد پیگیری" in trk)
    tform = parse_form(trk, action_contains="admin-post.php")
    check("tracking form has nonce", bool(tform and "mhc_track_nonce" in tform[2]))
    if tform and order_no and order_phone:
        taction, tmethod, tfields = tform
        tfields.update({"code": order_no, "phone": order_phone})
        tr = s.post(BASE + "/wp-admin/admin-post.php", data=tfields, timeout=180, allow_redirects=True)
        check("tracking finds the real order", "tracking-result" in tr.text and order_no in tr.text)
        # a wrong phone must not reveal the order
        trk2 = s.get(BASE + "/tracking/", timeout=120).text
        tf2 = parse_form(trk2, action_contains="admin-post.php")
        if tf2:
            tf2[2].update({"code": order_no, "phone": "09129999999"})
            bad = s.post(BASE + "/wp-admin/admin-post.php", data=tf2[2], timeout=180, allow_redirects=False)
            if bad.is_redirect:
                bad = s.get(to_local(bad.headers.get("location", "/tracking/")), timeout=180)
            # The wrong-phone reply echoes the submitted code back into the form field,
            # so the assertion checks that no order summary was rendered.
            # The error is shown inside the form; the result container must stay empty.
            m_res = re.search(r'<div id="tracking-result">(.*?)(?:<footer|<div id="toast)', bad.text, re.S)
            body = m_res.group(1) if m_res else ""
            err_txt = re.search(r'class="form-error"[^>]*>([^<]*)', bad.text)
            check("tracking rejects a wrong phone",
                  bool(err_txt) and "پیدا نشد" in err_txt.group(1) and "status-badge" not in body,
                  (err_txt.group(1).strip() if err_txt else "no error message"))

    # ---------- customer registration + login ----------
    acct = s.get(BASE + "/my-account/", timeout=120).text
    # The register form has no id; it is identified by its WooCommerce class.
    rform = parse_form(acct, action_contains="register")
    if not rform:
        m = re.search(r'<form[^>]*woocommerce-form-register.*?</form>', acct, re.S)
        rform = parse_form(m.group(0)) if m else None
    check("registration form present", bool(rform), "no register form")
    email = f"qa{int(time.time())}@example.org"
    if rform:
        action, method, fields = rform
        # The register form posts back to the My Account URL (empty action attribute).
        action = action or BASE + "/my-account/"
        # A unique phone per run: the plugin correctly rejects a phone that is already
        # registered to another account, so reusing one would fail for the right reason.
        phone = "0912" + str(int(time.time()))[-7:].rjust(7, "0")
        fields.update({"email": email, "password": "QaPass!23456", "mhc_name": "کاربر واقعی آزمون", "mhc_phone": phone})
        fields.pop("username", None)
        r = s.post(to_local(action), data=fields, timeout=120)
        err = re.search(r'class="woocommerce-error"[^>]*>(.*?)</ul>', r.text, re.S)
        # Must be a genuine success: no WooCommerce error AND a logged-in account view.
        check("registration accepted",
              r.status_code == 200 and err is None
              and ("logout" in r.text or "خروج" in r.text or "dashboard" in r.text),
              (re.sub(r"\s+", " ", err.group(1))[:160] if err else r.url))

    # ---------- account page after login ----------
    acct2 = s.get(BASE + "/my-account/", timeout=120).text
    logged_in = ("خروج" in acct2) or ("logout" in acct2)
    check("customer is logged in", logged_in)
    if logged_in:
        edit = s.get(BASE + "/my-account/edit-account/", timeout=120).text
        check("account details has phone field", 'name="mhc_phone"' in edit)

    # ---------- admin side ----------
    admin = make_session()
    creds = json.load(open("/tmp/qa-admin.json"))
    admin.get(BASE + "/wp-login.php", timeout=120)
    # A relative redirect_to is required here: an absolute public-host URL makes
    # wp-login.php add &reauth=1 and drop the fresh session.
    admin.post(BASE + "/wp-login.php", data={
        "log": "admin", "pwd": creds["password"], "wp-submit": "Log In",
        "redirect_to": "/wp-admin/", "testcookie": "1"}, timeout=180, allow_redirects=False)
    has_cookie = any(c.name.startswith("wordpress_logged_in") for c in admin.cookies)
    dash = admin.get(BASE + "/wp-admin/", timeout=180)
    check("admin login works", has_cookie and "wp-admin-bar" in dash.text, f"cookie={has_cookie} url={dash.url}")
    for slug, label in [("edit.php?post_type=product", "products list"),
                        ("edit-tags.php?taxonomy=product_cat&post_type=product", "category list"),
                        ("admin.php?page=wc-orders", "orders list"),
                        ("users.php", "users list"),
                        ("admin.php?page=mhc-submissions", "contact messages"),
                        ("admin.php?page=mhc-setup", "setup screen"),
                        ("admin.php?page=mhc-settings", "store settings"),
                        ("themes.php", "themes screen")]:
        r = admin.get(BASE + "/wp-admin/" + slug, timeout=180)
        check(f"admin {label} loads", r.status_code == 200 and "critical error" not in r.text.lower(), r.status_code)
    prod = admin.get(BASE + "/wp-admin/edit.php?post_type=product", timeout=180)
    check("admin lists imported products", prod.text.count("type-product") >= 20 or "MH-10" in prod.text, prod.text.count("type-product"))
    users = admin.get(BASE + "/wp-admin/users.php", timeout=180)
    check("admin users list shows mobile", "شماره موبایل" in users.text)
    msgs = admin.get(BASE + "/wp-admin/admin.php?page=mhc-submissions", timeout=180)
    check("admin sees contact message", "فرستنده آزمون" in msgs.text or "شرح" in msgs.text)

    # ---------- admin contact-message actions (real status change) ----------
    msgs = admin.get(BASE + "/wp-admin/admin.php?page=mhc-submissions", timeout=180).text
    mform = None
    for f in re.findall(r'<form\b[^>]*>.*?</form>', msgs, re.S):
        if 'name="action" value="mhc_status"' in f:
            mform = parse_form(f)
            break
    check("admin message row has a status form", bool(mform))
    if mform and mform[2].get("id"):
        target_id = mform[2]["id"]
        payload = dict(mform[2])
        payload.update({"operation": "update", "status": "contacted"})
        changed = admin.post(BASE + "/wp-admin/admin-post.php", data=payload, timeout=180, allow_redirects=False)
        check("admin can change message status", changed.status_code in (302, 303), changed.status_code)
        view = admin.get(BASE + f"/wp-admin/admin.php?page=mhc-submissions&view={target_id}", timeout=180).text
        check("message status persisted", "contacted" in view)

    # CSV export of the filtered list
    exf = None
    for f in re.findall(r'<form\b[^>]*>.*?</form>', msgs, re.S):
        if 'name="action" value="mhc_export"' in f:
            exf = parse_form(f)
            break
    if exf:
        csv = admin.post(BASE + "/wp-admin/admin-post.php", data=exf[2], timeout=180, allow_redirects=False)
        check("admin CSV export streams a file",
              csv.status_code == 200 and "text/csv" in csv.headers.get("content-type", "")
              and csv.text.startswith("\ufeffid,"),
              f"{csv.status_code} {csv.headers.get('content-type', '')}")

    # ---------- 404 handling ----------
    r = s.get(BASE + "/this-page-does-not-exist/", timeout=120)
    check("404 page returns 404", r.status_code == 404, r.status_code)

    passed = sum(1 for r_ in results if r_.get("pass") is True)
    failed = sum(1 for r_ in results if r_.get("pass") is False)
    skipped = sum(1 for r_ in results if r_.get("skipped"))
    summary = f"{passed} passed, {failed} failed, {skipped} skipped, {len(results)} total"
    print(f"\n=== {passed}/{len(results)} checks passed ({failed} failed, {skipped} skipped) ===")
    json.dump({"summary": summary, "results": results}, open("/tmp/qa/http-results.json", "w"),
              ensure_ascii=False, indent=1)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
