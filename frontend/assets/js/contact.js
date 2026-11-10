// One renderer for every public surface; contact values are provided only by /api/store/contact.
export function renderContact(settings, { icon, esc }) {
  const get = (id) => document.getElementById(id);
  const unavailable =
    '<p class="contact-muted">اطلاعات تماس موقتاً در دسترس نیست؛ می‌توانید از فرم پیام استفاده کنید.</p>';
  if (!settings) {
    if (get('contact-information')) get('contact-information').innerHTML = unavailable;
    if (get('header-contact-shortcut'))
      get('header-contact-shortcut').innerHTML = '<a href="contact.html">ارتباط با هشتگ</a>';
    return;
  }
  const demo = settings.demo;
  const badge =
    demo || settings.hasSamples ? '<span class="contact-demo-label">اطلاعات آزمایشی</span>' : '';
  const note = settings.notice
    ? `<p class="contact-disclosure">${icon('shield')}<span>${esc(settings.notice)}</span></p>`
    : '';
  const external = ' target="_blank" rel="noopener noreferrer"';
  const link = (item, content, className = '', newTab = false) =>
    item.href
      ? `<a class="${className}" href="${esc(item.href)}"${newTab ? external : ''}>${content}</a>`
      : `<span class="${className} contact-inactive">${content}<small>آزمایشی · غیرفعال</small></span>`;
  const number = (item) => `<bdi dir="ltr">${esc(item.value)}</bdi>`;
  const info = (label, content, symbol, key, extra = '') =>
    `<article class="contact-info-card ${extra}" data-contact-field="${key}"><span class="contact-icon">${icon(symbol)}</span><div><h3>${label}</h3>${content}</div></article>`;
  const phoneContent = settings.phone
    ? link(settings.phone, number(settings.phone), 'contact-value')
    : '';
  const whatsappContent = settings.whatsapp
    ? link(settings.whatsapp, number(settings.whatsapp), 'contact-value', true)
    : '';
  const mailContent = settings.email
    ? link(settings.email, `<bdi dir="ltr">${esc(settings.email.value)}</bdi>`, 'contact-value')
    : '';
  const addressContent = `<address class="contact-value">${esc(settings.address)}</address>`;
  const hoursContent = `<p class="contact-value">${esc(settings.workingHours)}</p>`;
  const socialLinks = ['instagram', 'telegram']
    .filter((name) => settings[name])
    .map((name) => {
      const title = name === 'instagram' ? 'اینستاگرام' : 'تلگرام';
      const item = settings[name];
      return `<div class="contact-social-item" data-contact-field="${name}">${link(item, `${icon(name)}<span>${title}</span>`, 'contact-social-link', true)}<bdi class="contact-social-url" dir="ltr">${esc(item.value)}</bdi></div>`;
    })
    .join('');
  const cards = [
    settings.phone && info('تماس با فروشگاه', phoneContent, 'phone', 'phone'),
    settings.whatsapp && info('گفت‌وگو در واتساپ', whatsappContent, 'whatsapp', 'whatsapp'),
    settings.email && info('ایمیل فروشگاه', mailContent, 'mail', 'email'),
    settings.address && info('نشانی فروشگاه', addressContent, 'pin', 'address'),
    settings.workingHours && info('ساعت همراهی ما', hoursContent, 'clock', 'workingHours'),
    socialLinks &&
      info(
        'هشتگ در شبکه‌های اجتماعی',
        `<div class="contact-socials">${socialLinks}</div>`,
        'heart',
        'socials'
      ),
  ]
    .filter(Boolean)
    .join('');
  if (get('contact-information'))
    get('contact-information').innerHTML =
      `<div class="contact-section-label"><span class="overline">راه‌های ارتباط با ${esc(settings.storeName)}</span>${badge}</div>${note}${cards ? `<div class="contact-card-grid">${cards}</div>` : '<p class="contact-muted">راه‌های تماس پس از تأیید فروشگاه درج می‌شوند. فعلاً از فرم زیر استفاده کنید.</p>'}`;

  if (get('home-contact')) {
    const facts = [
      settings.phone && info('صدای شما را می‌شنویم', phoneContent, 'phone', 'phone'),
      settings.whatsapp &&
        info(
          'همراه شما در واتساپ',
          settings.whatsapp.href
            ? link(settings.whatsapp, `شروع گفت‌وگو ${icon('arrow')}`, 'button outline', true)
            : `<span class="contact-value">${number(settings.whatsapp)}</span><button class="button outline" type="button" disabled>واتساپ آزمایشی · غیرفعال</button>`,
          'whatsapp',
          'whatsapp',
          'contact-whatsapp-card'
        ),
      settings.address && info('نشانی هشتگ', addressContent, 'pin', 'address'),
      settings.workingHours && info('ساعات کاری', hoursContent, 'clock', 'workingHours'),
    ]
      .filter(Boolean)
      .join('');
    get('home-contact').innerHTML =
      `<div class="contact-band-intro"><span class="overline">یک گفت‌وگوی خوب، یک انتخاب بهتر</span><h2 id="home-contact-heading">برای انتخاب بعدی،<br>کنار شما هستیم.</h2><p>سؤالی درباره محصولات دارید؟ راه‌های ارتباط با ${esc(settings.storeName)} را اینجا پیدا کنید.</p>${badge}<a class="button dark" href="contact.html">ارتباط با ما ${icon('arrow')}</a></div><div class="contact-band-details">${facts ? `<div class="contact-band-grid">${facts}</div>` : '<p class="contact-muted">می‌توانید از فرم تماس برای ثبت پیام استفاده کنید.</p>'}${note}</div>`;
  }

  if (get('footer-contact-details')) {
    const row = (key, content, symbol) =>
      `<div class="footer-contact-row" data-contact-field="${key}">${icon(symbol)}<div>${content}</div></div>`;
    get('footer-contact-details').innerHTML =
      `<h3>با ${esc(settings.storeName)} در ارتباط باشید</h3>${badge}${demo ? '<p class="footer-contact-demo-note">تماس‌ها و لینک‌های زیر آزمایشی و غیرفعال‌اند.</p>' : ''}<div class="footer-contact-list">${settings.phone ? row('phone', phoneContent, 'phone') : ''}${settings.whatsapp ? row('whatsapp', whatsappContent, 'whatsapp') : ''}${settings.address ? row('address', addressContent, 'pin') : ''}${settings.email ? row('email', mailContent, 'mail') : ''}${settings.workingHours ? row('workingHours', hoursContent, 'clock') : ''}</div>${socialLinks ? `<div class="footer-contact-socials">${socialLinks}</div>` : ''}<a href="contact.html" class="footer-contact">صفحه تماس و ارسال پیام ${icon('arrow')}</a><div class="demo-tag">محیط نمایشی · بدون پرداخت واقعی</div>`;
  }

  if (get('header-contact-shortcut')) {
    get('header-contact-shortcut').innerHTML = settings.phone?.href
      ? link(settings.phone, `${icon('phone')}${number(settings.phone)}`, 'header-contact-link')
      : settings.whatsapp?.href
        ? link(
            settings.whatsapp,
            `${icon('whatsapp')} گفت‌وگو در واتساپ`,
            'header-contact-link',
            true
          )
        : `<a class="header-contact-link" href="contact.html">${icon('headset')} ارتباط با هشتگ</a>`;
  }

  const map = get('store-map');
  if (map && settings.map) {
    map.hidden = false;
    map.innerHTML = `<span class="contact-icon">${icon('pin')}</span><div><span class="overline">برای دیدار حضوری</span><h2 id="store-map-heading">موقعیت فروشگاه روی نقشه</h2>${settings.address ? `<p>${esc(settings.address)}</p>` : ''}<a class="button outline" href="${esc(settings.map.href)}"${external}>مشاهده موقعیت در OpenStreetMap ${icon('arrow')}</a><small>نقشه در وب‌سایت مستقل باز می‌شود؛ تا زمان کلیک، اطلاعاتی به سرویس نقشه ارسال نمی‌شود.</small></div>`;
  }
}
