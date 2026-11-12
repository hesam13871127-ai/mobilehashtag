<?php
/**
 * Plugin Name: Mobile Hashtag Core
 * Description: تنظیمات فروشگاه، پیام‌های مشتریان، خبرنامه، علاقه‌مندی‌ها و مهاجرت ایمن کاتالوگ هشتگ؛ مستقل از پوسته.
 * Version: 1.0.6
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Author: Mobile Hashtag
 * License: GPL-2.0-or-later
 * Text Domain: mobile-hashtag-core
 */
if (!defined('ABSPATH')) { exit; }
define('MHC_VERSION', '1.0.6');
define('MHC_PATH', plugin_dir_path(__FILE__));
require_once MHC_PATH . 'includes/settings.php';
require_once MHC_PATH . 'includes/submissions.php';
require_once MHC_PATH . 'includes/wishlist.php';
require_once MHC_PATH . 'includes/importer.php';
require_once MHC_PATH . 'includes/setup.php';
require_once MHC_PATH . 'includes/privacy.php';
register_activation_hook(__FILE__, 'mhc_install');
function mhc_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    dbDelta("CREATE TABLE {$wpdb->prefix}mh_submissions (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        uuid varchar(36) NOT NULL,
        created_at datetime NOT NULL,
        type varchar(24) NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'new',
        name varchar(100) NOT NULL DEFAULT '',
        phone varchar(32) NOT NULL DEFAULT '',
        email varchar(254) NOT NULL,
        message longtext NOT NULL,
        source_url text NOT NULL,
        fields longtext NOT NULL,
        mail_status varchar(24) NOT NULL DEFAULT 'pending',
        mail_error text NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY uuid (uuid),
        KEY type_status (type,status),
        KEY created_at (created_at)
    ) $charset;");
    add_option('mhc_settings', mhc_defaults());
}
/**
 * Version upgrade handler: runs once per activation/plugins_loaded.
 * Saves previous DB version BEFORE mhc_install() updates it, so flag reset works correctly.
 */
add_action('plugins_loaded', function () {
    $previous_version = get_option('mhc_db_version', '');
    if ($previous_version !== MHC_VERSION) {
        mhc_install();
        update_option('mhc_db_version', MHC_VERSION, false);
        // Reset initialization flags on upgrade so pages and catalog are reprocessed idempotently.
        if ($previous_version !== '') {
            delete_option('mhc_pages_ready');
            delete_option('mhc_import_complete');
            delete_option('mhc_setup_report');
            delete_option('mhc_import_report');
            delete_option('mhc_import_offset');
        }
    }
});
/**
 * Automatic initialization: creates required WordPress pages and imports the reference catalog
 * without requiring the user to visit the setup screen. Runs once per version.
 */
add_action('init', function () {
    if (!current_user_can('manage_options') || wp_doing_ajax()) { return; }
    // Create/connect all required pages (about, contact, shop, cart, etc.)
    if (function_exists('mhc_setup_pages')) {
        $ready_key = 'mhc_pages_ready';
        $ready_val = MHC_VERSION . (class_exists('WooCommerce') ? '-wc' : '-no-wc');
        if (get_option($ready_key) !== $ready_val) {
            mhc_setup_pages(true); // $connect=true ensures WooCommerce page IDs are stored
        }
    }
    // Import catalog once WooCommerce is active — only if import not fully completed.
    if (function_exists('mhc_auto_import') && class_exists('WooCommerce') && !get_option('mhc_import_complete')) {
        mhc_auto_import();
    }
}, 15);
add_action('before_woocommerce_init', function () {
    if (class_exists('Automattic\\WooCommerce\\Utilities\\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});
add_filter('woocommerce_currencies', function ($currencies) { $currencies['IRT'] = 'تومان ایران'; return $currencies; });
add_filter('woocommerce_currency_symbol', function ($symbol, $code) {
    return $code === 'IRT' ? 'تومان' : ($code === 'IRR' ? 'ریال' : $symbol);
}, 10, 2);
// WooCommerce's currency is the input unit AND the display/order/email unit.
// No price filters, conversion, or changes to stored amounts are applied.
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('mhc-forms', plugins_url('assets/core.css', __FILE__), [], MHC_VERSION);
});
add_action('admin_menu', function () {
    add_menu_page('موبایل هشتگ', 'Mobile Hashtag', 'manage_options', 'mhc-settings', 'mhc_settings_page', 'dashicons-smartphone');
    add_submenu_page('mhc-settings', 'تنظیمات فروشگاه', 'Store Settings', 'manage_options', 'mhc-settings', 'mhc_settings_page');
    add_submenu_page('mhc-settings', 'پیام‌ها و خبرنامه', 'پیام‌ها و خبرنامه', 'manage_options', 'mhc-submissions', 'mhc_submissions_page');
    add_submenu_page('mhc-settings', 'راه‌اندازی فروشگاه', 'راه‌اندازی فروشگاه', 'manage_options', 'mhc-setup', 'mhc_setup_screen');
    add_submenu_page('mhc-settings', 'مهاجرت کاتالوگ', 'مهاجرت کاتالوگ', 'manage_options', 'mhc-import', 'mhc_import_page');
    add_submenu_page('mhc-settings', 'وضعیت فروشگاه', 'وضعیت فروشگاه', 'manage_options', 'mhc-status', 'mhc_status_screen');
});
// Guest nonces and wishlist buttons are personalized; do not cache rendered HTML across guests.
add_action('template_redirect',function(){
    if (!defined('DONOTCACHEPAGE')) { define('DONOTCACHEPAGE',true); }
    nocache_headers();
},0);

// This plugin uses WordPress APIs/$wpdb only; WooCommerce is installed separately.
add_action('admin_notices', function () {
    if (!current_user_can('activate_plugins') || class_exists('WooCommerce')) { return; }
    echo '<div class="notice notice-warning"><p dir="rtl">برای فعال‌شدن محصولات، سبد خرید، تسویه و حساب فروشگاه موبایل هشتگ، افزونهٔ رسمی WooCommerce را از مخزن وردپرس نصب و فعال کنید. فرم‌ها و پیام‌های Core مستقل باقی می‌مانند. <a href="' . esc_url(admin_url('plugin-install.php?s=WooCommerce&tab=search&type=term')) . '">نصب ووکامرس رسمی</a></p></div>';
});
