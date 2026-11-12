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
function mhc_contact_block() {
    $s = mhc_settings(); $labels = ['phone'=>'تماس تلفنی','whatsapp'=>'واتساپ','address'=>'نشانی فروشگاه','email'=>'ایمیل','hours'=>'ساعات کاری','instagram'=>'اینستاگرام','telegram'=>'تلگرام'];
    ob_start(); ?>
    <div class="mhc-contact" dir="rtl">
    <?php if ($s['mode'] === 'demo') : ?><p class="contact-demo-label">اطلاعات تماس نمونه و غیرواقعی — لینک‌ها غیرفعال‌اند</p><?php endif; ?>
    <div class="contact-card-grid"><?php foreach ($labels as $key => $label) : if (!$s[$key]) { continue; } $href = mhc_contact_href($key, $s[$key], $s); ?>
    <div class="contact-info-card"><div><h3><?php echo esc_html($label); ?></h3>
    <?php if ($href) : ?><a class="contact-value" href="<?php echo esc_url($href); ?>" rel="noopener noreferrer"><?php else : ?><span class="contact-value contact-inactive"><?php endif; ?>
    <?php echo esc_html($s[$key]); ?><?php echo $href ? '</a>' : '</span>'; ?></div></div>
    <?php endforeach; ?></div></div>
    <?php return ob_get_clean();
}
add_shortcode('mh_contact_details', 'mhc_contact_block');
