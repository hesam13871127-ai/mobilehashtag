<?php
if (!defined('ABSPATH')) { exit; }
function mhc_defaults() {
    return [
        'mode' => 'demo', 'store_name' => 'موبایل هشتگ',
        'phone' => '+1 202 555 0142', 'whatsapp' => '+1 202 555 0143',
        'address' => 'شهر نمونه، خیابان نمونه، ساختمان نمایشی هشتگ، طبقهٔ اول (نشانی غیرواقعی)',
        'email' => 'hello@mobile-hashtag.example',
        'hours' => 'شنبه تا پنجشنبه، ۱۰:۰۰ تا ۲۰:۰۰ — برنامهٔ نمونه',
        'instagram' => 'https://instagram.example/mobilehashtag',
        'telegram' => 'https://telegram.example/mobilehashtag',
        'recipient' => '',
    ];
}
function mhc_settings() { return wp_parse_args(get_option('mhc_settings', []), mhc_defaults()); }
function mhc_sanitize_settings($input) {
    $out = [];
    foreach (mhc_defaults() as $key => $default) {
        $value = isset($input[$key]) && is_scalar($input[$key]) ? (string) $input[$key] : '';
        if (in_array($key, ['email', 'recipient'], true)) { $out[$key] = sanitize_email($value); }
        elseif (in_array($key, ['instagram', 'telegram'], true)) { $out[$key] = esc_url_raw($value, ['https']); }
        elseif ($key === 'mode') { $out[$key] = $value === 'live' ? 'live' : 'demo'; }
        else { $out[$key] = mb_substr(sanitize_text_field($value), 0, $key === 'address' ? 500 : 200); }
    }
    return $out;
}
add_action('admin_init', function () {
    register_setting('mhc_settings_group', 'mhc_settings', ['type' => 'array', 'sanitize_callback' => 'mhc_sanitize_settings', 'default' => mhc_defaults()]);
});
function mhc_settings_page() {
    if (!current_user_can('manage_options')) { return; }
    $s = mhc_settings();
    $labels = ['store_name' => 'نام فروشگاه', 'phone' => 'شماره تلفن با کد کشور', 'whatsapp' => 'شماره واتساپ با کد کشور', 'address' => 'نشانی', 'email' => 'ایمیل عمومی', 'hours' => 'ساعات کاری', 'instagram' => 'پیوند اینستاگرام', 'telegram' => 'پیوند تلگرام', 'recipient' => 'ایمیل مدیر برای اعلان پیام‌ها'];
    ?>
    <div class="wrap" dir="rtl"><h1>Mobile Hashtag — تنظیمات فروشگاه</h1>
    <p>اطلاعات پیش‌فرض کاملاً فرضی و لینک‌ها غیرفعال‌اند. ابتدا اطلاعات واقعی را جایگزین کنید، سپس حالت واقعی را فعال کنید. نشانی تأییدشده‌ای برای نقشه ثبت نشده است؛ نقشهٔ ساختگی نمایش داده نمی‌شود.</p>
    <form action="options.php" method="post"><?php settings_fields('mhc_settings_group'); ?>
    <table class="form-table"><tr><th><label for="mhc-mode">حالت اطلاعات تماس</label></th><td><select id="mhc-mode" name="mhc_settings[mode]"><option value="demo" <?php selected($s['mode'], 'demo'); ?>>نمونه — غیرفعال</option><option value="live" <?php selected($s['mode'], 'live'); ?>>واقعی — پس از تأیید مالک</option></select></td></tr>
    <?php foreach ($labels as $key => $label) : ?><tr><th><label for="mhc-<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></label></th><td><input class="regular-text" id="mhc-<?php echo esc_attr($key); ?>" name="mhc_settings[<?php echo esc_attr($key); ?>]" value="<?php echo esc_attr($s[$key]); ?>" type="<?php echo in_array($key, ['email','recipient'], true) ? 'email' : 'text'; ?>"></td></tr><?php endforeach; ?></table>
    <?php submit_button('ذخیره تنظیمات'); ?></form>
    <h2>واحد قیمت</h2><p>واحد ورود قیمت و نمایش از یک تنظیم واحد در ووکامرس ← پیکربندی ← همگانی انتخاب می‌شود: «تومان ایران» یا «ریال ایران». افزونه هیچ مبلغی را ضرب یا تقسیم نمی‌کند. تغییر واحد، ارقام محصولات موجود را تبدیل نمی‌کند؛ فقط در نصب تازه یا پس از بازبینی دستی تمام قیمت‌ها آن را تغییر دهید. سفارش‌های قبلی واحد ثبت‌شدهٔ خود را نگه می‌دارند.</p>
    <h2>ایمیل</h2><p>گیرنده باید واقعی و تأییدشده باشد. مقدار خالی یا دامنهٔ نمونه، ارسال اعلان را غیرفعال می‌کند. SMTP را روی هاست تنظیم و دریافت واقعی را با یک پیام آزمایشی بررسی کنید. پذیرفته‌شدن توسط wp_mail اثبات تحویل نیست. پیام‌ها حتی در صورت شکست ایمیل ذخیره می‌شوند.</p></div>
    <?php
}
function mhc_contact_href($key, $value, $settings = null) {
    $s = $settings ?? mhc_settings();
    if ($s['mode'] !== 'live' || !$value || preg_match('/\.example(?:[\/:]|$)/i', $value)) { return ''; }
    if (in_array($key, ['phone','whatsapp'], true)) {
        $number = preg_replace('/[\s().-]/', '', $value);
        if (!preg_match('/^\+[1-9][0-9]{7,14}$/', $number) || preg_match('/^\+120255501[0-9]{2}$/', $number)) { return ''; }
        return $key === 'phone' ? 'tel:' . $number : 'https://wa.me/' . substr($number, 1);
    }
    if ($key === 'email') { return is_email($value) ? 'mailto:' . $value : ''; }
    if (in_array($key, ['instagram','telegram'], true)) { return esc_url_raw($value, ['https']); }
    return '';
}
/**
 * Contact cards rendered exactly like the approved design source (frontend/assets/js/contact.js):
 * same section label, demo badge, disclosure notice, card grid, icon/heading/value order,
 * field order, and the same fallbacks when a value is missing or still a sample.
 */
/**
 * Inline icon set, identical to the theme's approved source icons. The plugin does not
 * depend on the theme being active, so it carries its own copy.
 */
function mhc_icon($name) {
    static $paths = null;
    if ($paths === null) {
        $paths = ['phone'=>'<path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a13 13 0 0 1-7-7l2-2-2-5Z"/>','whatsapp'=>'<path d="M20 11.5a8.5 8.5 0 0 1-12.8 7.4L3 21l1.8-4.4A8.5 8.5 0 1 1 20 11.5Z"/><path d="m8 7 2 2-1 2 3 3 2-1 2 2c-3 4-12-5-8-8Z"/>','clock'=>'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>','instagram'=>'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7"/>','telegram'=>'<path d="m3 10 18-7-4 18-6-6-4 3 1-6 9-5-7 7-7-4Z"/>','shield'=>'<path d="m12 3 8 3v7c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>','headset'=>'<path d="M4 14v-3a8 8 0 0 1 16 0v7c0 3-3 4-6 4"/><rect x="2" y="11" width="5" height="8" rx="2"/><rect x="17" y="11" width="5" height="8" rx="2"/>','pin'=>'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>','mail'=>'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>','heart'=>'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>','box'=>'<path d="m12 2 10 5v10l-10 5L2 17V7l10-5ZM2 7l10 5 10-5M12 12v10M7 4l10 5"/>'];
    }
    $body = $paths[$name] ?? $paths['box'];
    return '<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $body . '</svg>';
}
function mhc_contact_block() {
    $s = mhc_settings();
    $demo = $s['mode'] !== 'live';
    // A value is a sample when it is still the shipped default or uses a reserved example domain.
    $is_sample = function ($key, $value) use ($s) {
        if ($value === '') { return true; }
        if (preg_match('/\.example(?:[\/:]|$)|\(نشانی غیرواقعی\)|—\s*برنامهٔ نمونه/u', $value)) { return true; }
        return $value === (mhc_defaults()[$key] ?? null);
    };
    $samples = [];
    foreach (['phone','whatsapp','address','email','hours','instagram','telegram'] as $key) {
        if ($s[$key] !== '' && $is_sample($key, $s[$key])) { $samples[] = $key; }
    }
    $has_samples = (bool) $samples;
    $badge = ($demo || $has_samples) ? '<span class="contact-demo-label">اطلاعات آزمایشی</span>' : '';
    $notice = $demo
        ? 'اطلاعات تماس آزمایشی است؛ شماره‌ها و نشانی متعلق به فروشگاه واقعی نیستند. تماس و لینک‌های بیرونی غیرفعال‌اند.'
        : ($has_samples ? 'برخی اطلاعات هنوز نمونه‌اند و لینک آن‌ها غیرفعال است.' : '');
    $note = $notice !== ''
        ? '<p class="contact-disclosure">' . mhc_icon('shield') . '<span>' . esc_html($notice) . '</span></p>'
        : '';
    $link = function ($key, $value, $content, $class = '', $new_tab = false) use ($s) {
        $href = mhc_contact_href($key, $value, $s);
        if (!$href) {
            return '<span class="' . esc_attr($class) . ' contact-inactive">' . $content . '<small>آزمایشی · غیرفعال</small></span>';
        }
        return '<a class="' . esc_attr($class) . '" href="' . esc_url($href) . '"' . ($new_tab ? ' target="_blank" rel="noopener noreferrer"' : '') . '>' . $content . '</a>';
    };
    $number = fn($value) => '<bdi dir="ltr">' . esc_html($value) . '</bdi>';
    $card = fn($label, $content, $symbol, $key, $extra = '') =>
        '<article class="contact-info-card ' . esc_attr($extra) . '" data-contact-field="' . esc_attr($key) . '">'
        . '<span class="contact-icon">' . mhc_icon($symbol) . '</span><div><h3>' . esc_html($label) . '</h3>' . $content . '</div></article>';
    $socials = '';
    foreach (['instagram' => 'اینستاگرام', 'telegram' => 'تلگرام'] as $key => $title) {
        if (!$s[$key]) { continue; }
        $socials .= '<div class="contact-social-item" data-contact-field="' . esc_attr($key) . '">'
            . $link($key, $s[$key], mhc_icon($key) . '<span>' . esc_html($title) . '</span>', 'contact-social-link', true)
            . '<bdi class="contact-social-url" dir="ltr">' . esc_html($s[$key]) . '</bdi></div>';
    }
    $cards = '';
    if ($s['phone']) { $cards .= $card('تماس با فروشگاه', $link('phone', $s['phone'], $number($s['phone']), 'contact-value'), 'phone', 'phone'); }
    if ($s['whatsapp']) { $cards .= $card('گفت‌وگو در واتساپ', $link('whatsapp', $s['whatsapp'], $number($s['whatsapp']), 'contact-value', true), 'whatsapp', 'whatsapp'); }
    if ($s['email']) { $cards .= $card('ایمیل فروشگاه', $link('email', $s['email'], '<bdi dir="ltr">' . esc_html($s['email']) . '</bdi>', 'contact-value'), 'mail', 'email'); }
    if ($s['address']) { $cards .= $card('نشانی فروشگاه', '<address class="contact-value">' . esc_html($s['address']) . '</address>', 'pin', 'address'); }
    if ($s['hours']) { $cards .= $card('ساعت همراهی ما', '<p class="contact-value">' . esc_html($s['hours']) . '</p>', 'clock', 'workingHours'); }
    if ($socials !== '') { $cards .= $card('هشتگ در شبکه‌های اجتماعی', '<div class="contact-socials">' . $socials . '</div>', 'heart', 'socials'); }
    $section_label = '<div class="contact-section-label"><span class="overline">راه‌های ارتباط با ' . esc_html($s['store_name']) . '</span>' . $badge . '</div>';
    $body = $cards !== ''
        ? '<div class="contact-card-grid">' . $cards . '</div>'
        : '<p class="contact-muted">راه‌های تماس پس از تأیید فروشگاه درج می‌شوند. فعلاً از فرم زیر استفاده کنید.</p>';
    return '<div class="mhc-contact" dir="rtl">' . $section_label . $note . $body . '</div>';
}
add_shortcode('mh_contact_details', 'mhc_contact_block');
