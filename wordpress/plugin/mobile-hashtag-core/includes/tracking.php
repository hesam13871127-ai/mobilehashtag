<?php
/**
 * Order tracking — the hand-coded store's Persian form (frontend/tracking.html),
 * answered from real WooCommerce orders.
 *
 * The source asks for a tracking code plus the recipient mobile number and then shows
 * the order. The original page shipped with a demo dataset; here the lookup runs against
 * real orders that WooCommerce recorded, so nothing is simulated.
 *
 * @package Mobile_Hashtag_Core
 */
if (!defined('ABSPATH')) { exit; }

/** Normalise an Iranian mobile number for comparison. */
function mhc_track_normalise_phone($raw) {
    $digits = preg_replace('/\D+/', '', (string) $raw);
    $digits = strtr($digits, ['۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9']);
    if (strlen($digits) === 10 && $digits[0] === '9') { $digits = '0' . $digits; }
    if (strlen($digits) === 12 && str_starts_with($digits, '98')) { $digits = '0' . substr($digits, 2); }
    return $digits;
}

/** Find an order by form input. Returns WC_Order|null. */
function mhc_track_find_order($code, $phone) {
    if (!function_exists('wc_get_order')) { return null; }
    $code = trim((string) $code);
    $phone = mhc_track_normalise_phone($phone);
    if ($code === '' || $phone === '') { return null; }

    // Accept "MH-1234", "1234" and the WooCommerce order number/key formats.
    $numeric = preg_replace('/\D+/', '', $code);
    $ids = [];
    if ($numeric !== '') { $ids[] = (int) $numeric; }
    if (str_starts_with($code, 'wc_order_')) {
        $id = wc_get_order_id_by_order_key($code);
        if ($id) { $ids[] = (int) $id; }
    }
    foreach (array_unique($ids) as $id) {
        $order = $id ? wc_get_order($id) : null;
        if (!$order) { continue; }
        $order_phone = mhc_track_normalise_phone($order->get_billing_phone());
        if ($order_phone === $phone) { return $order; }
    }
    return null;
}

/** Minimal read-only summary of an order for the public tracking page. */
function mhc_track_summary($order) {
    $items = [];
    foreach ($order->get_items() as $item) {
        $items[] = [
            'name'     => $item->get_name(),
            'quantity' => (int) $item->get_quantity(),
            'total'    => $order->get_line_subtotal($item, true, false),
        ];
    }
    return [
        'number'   => $order->get_order_number(),
        'status'   => wc_get_order_status_name($order->get_status()),
        'date'     => $order->get_date_created() ? wc_format_datetime($order->get_date_created()) : '',
        'total'    => $order->get_total(),
        'items'    => $items,
        'tracking' => $order->get_meta('_mhc_tracking_code'),
    ];
}

/** Persistent result/error state for the rendered form (survives the PRG redirect). */
function mhc_track_result() {
    if (empty($_GET['mh_track'])) { return null; }
    $token = sanitize_text_field(wp_unslash($_GET['mh_track']));
    $payload = get_transient('mhc_track_' . $token);
    if (!is_array($payload)) { return null; }
    delete_transient('mhc_track_' . $token);
    return $payload;
}

/** shortcode [mh_tracking] */
function mhc_tracking_shortcode() {
    $result = mhc_track_result();
    ob_start();
    ?>
    <div class="page-heading centered">
        <span class="overline">از انتخاب تا همراهی</span>
        <h1>پیگیری سفارش</h1>
        <p>کد پیگیری و شماره موبایل گیرنده را وارد کنید.</p>
    </div>
    <form id="tracking-form" class="panel form-stack" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" dir="rtl">
        <input type="hidden" name="action" value="mhc_track">
        <?php wp_nonce_field('mhc_track', 'mhc_track_nonce'); ?>
        <label>کد پیگیری
            <input name="code" required dir="ltr" placeholder="MH-…" maxlength="40" value="<?php echo esc_attr($result['code'] ?? ''); ?>">
        </label>
        <label>شماره موبایل
            <input name="phone" type="tel" required dir="ltr" placeholder="09xxxxxxxxx" maxlength="16" value="<?php echo esc_attr($result['phone'] ?? ''); ?>">
        </label>
        <?php if (!empty($result['error'])) : ?>
            <p class="form-error" role="alert"><?php echo esc_html($result['error']); ?></p>
        <?php endif; ?>
        <button class="button dark" type="submit">بررسی سفارش</button>
    </form>
    <div id="tracking-result">
    <?php if (!empty($result['order'])) : $o = $result['order']; ?>
        <div class="panel tracking-result">
            <span class="status-badge"><?php echo esc_html($o['status']); ?></span>
            <h2 dir="ltr"><?php echo esc_html($o['tracking'] ?: $o['number']); ?></h2>
            <p class="small muted"><?php echo esc_html($o['date']); ?></p>
            <div class="summary-line"><span>مبلغ سفارش</span><span><?php echo wp_kses_post(wc_price($o['total'])); ?></span></div>
            <?php foreach ($o['items'] as $item) : ?>
                <div class="summary-line">
                    <span><?php echo esc_html($item['name']); ?> <b>× <?php echo esc_html(number_format_i18n($item['quantity'])); ?></b></span>
                    <span><?php echo wp_kses_post(wc_price($item['total'])); ?></span>
                </div>
            <?php endforeach; ?>
            <p class="notice">وضعیت نمایش‌داده‌شده از سفارش ثبت‌شده در فروشگاه خوانده می‌شود. برای پیگیری تفصیلی، وارد حساب کاربری خود شوید.</p>
            <a class="text-link section" href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">حساب کاربری من</a>
        </div>
    <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('mh_tracking', 'mhc_tracking_shortcode');

/** Handle the submitted tracking form (Post/Redirect/Get, no data leak in URLs). */
function mhc_track_submit() {
    $nonce = isset($_POST['mhc_track_nonce']) ? sanitize_text_field(wp_unslash($_POST['mhc_track_nonce'])) : '';
    if (!wp_verify_nonce($nonce, 'mhc_track')) {
        wp_die(esc_html('درخواست نامعتبر است.'), '', ['response' => 403, 'back_link' => true]);
    }
    $code  = isset($_POST['code']) ? sanitize_text_field(wp_unslash($_POST['code'])) : '';
    $phone = isset($_POST['phone']) ? sanitize_text_field(wp_unslash($_POST['phone'])) : '';

    $payload = ['code' => $code, 'phone' => $phone];
    $order = mhc_track_find_order($code, $phone);
    if ($order) {
        $payload['order'] = mhc_track_summary($order);
    } else {
        // Same message for "not found" and "wrong phone" so orders cannot be probed.
        $payload['error'] = 'سفارشی با این کد پیگیری و شماره موبایل پیدا نشد.';
    }
    if (mhc_track_find_order($code, $phone) === null && preg_match('/^[\d\s+-]+$/', $code) === 0 && !str_starts_with($code, 'wc_order_') && !str_starts_with($code, 'MH-')) {
        $payload['error'] = 'کد پیگیری معتبر نیست.';
    }

    $token = wp_generate_password(20, false, false);
    set_transient('mhc_track_' . $token, $payload, 5 * MINUTE_IN_SECONDS);
    wp_safe_redirect(add_query_arg('mh_track', $token, wc_get_page_permalink('shop') ? home_url('/tracking/') : home_url('/')));
    exit;
}
add_action('admin_post_mhc_track', 'mhc_track_submit');
add_action('admin_post_nopriv_mhc_track', 'mhc_track_submit');
