<?php
if (!defined('ABSPATH')) { exit; }
/** Opaque, signed, HttpOnly cookie; product IDs never supplied by the cookie. */
function mhc_guest_token() {
    $cookie = isset($_COOKIE['mhc_guest']) && is_string($_COOKIE['mhc_guest']) ? $_COOKIE['mhc_guest'] : '';
    $parts = explode('.', $cookie);
    if (count($parts) === 2 && preg_match('/^[a-f0-9]{48}$/', $parts[0]) && hash_equals(hash_hmac('sha256', $parts[0], wp_salt('auth')), $parts[1])) { return $parts[0]; }
    return '';
}
add_action('init', function () {
    if (is_user_logged_in() || wp_doing_cron() || (defined('WP_CLI') && WP_CLI)) { return; }
    if (!mhc_guest_token() && !headers_sent()) {
        $token = bin2hex(random_bytes(24)); $cookie = $token . '.' . hash_hmac('sha256', $token, wp_salt('auth'));
        setcookie('mhc_guest', $cookie, ['expires'=>time()+30*DAY_IN_SECONDS, 'path'=>COOKIEPATH ?: '/', 'secure'=>is_ssl(), 'httponly'=>true, 'samesite'=>'Lax']);
        $_COOKIE['mhc_guest'] = $cookie;
    }
}, 1);
add_filter('nonce_user_logged_out', function ($uid, $action) {
    if (is_string($action) && str_starts_with($action, 'mhc_')) {
        return mhc_guest_token() ? hexdec(substr(hash('sha256',mhc_guest_token()),0,12)) : $uid;
    }
    return $uid;
}, 10, 2);
function mhc_wishlist_ids() {
    $ids = is_user_logged_in() ? get_user_meta(get_current_user_id(),'_mhc_wishlist',true) : (mhc_guest_token() ? get_transient('mhc_wish_'.mhc_guest_token()) : []);
    return is_array($ids) ? array_values(array_unique(array_map('absint',$ids))) : [];
}
function mhc_wishlist_store($ids) {
    $ids = array_slice(array_values(array_unique(array_map('absint',$ids))), 0, 100);
    if (is_user_logged_in()) { $saved=update_user_meta(get_current_user_id(), '_mhc_wishlist', $ids); return (bool)$saved || mhc_wishlist_ids()===$ids; }
    if (mhc_guest_token()) { $saved=set_transient('mhc_wish_'.mhc_guest_token(), $ids, 30*DAY_IN_SECONDS); return (bool)$saved || mhc_wishlist_ids()===$ids; }
    return false;
}
add_action('wp_login', function ($login,$user) {
    $token=mhc_guest_token(); if (!$token) { return; }
    $guest=get_transient('mhc_wish_'.$token); $existing=get_user_meta($user->ID,'_mhc_wishlist',true);
    if (is_array($guest)) {
        update_user_meta($user->ID,'_mhc_wishlist', array_slice(array_values(array_unique(array_merge(is_array($existing)?$existing:[], $guest))),0,100));
        delete_transient('mhc_wish_'.$token);
    }
},10,2);
function mhc_wishlist_button($id, $compact=false) {
    if (!function_exists('wc_get_product')) { return ''; }
    $active=in_array(absint($id),mhc_wishlist_ids(),true);
    ob_start(); ?>
    <form class="mhc-wish-form <?php echo $compact ? 'mhc-wish-compact' : ''; ?>" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post">
    <input type="hidden" name="action" value="mhc_wishlist"><input type="hidden" name="product_id" value="<?php echo absint($id); ?>"><input type="hidden" name="operation" value="<?php echo $active?'remove':'add'; ?>">
    <?php wp_nonce_field('mhc_wishlist','mhc_nonce',false); ?>
    <button type="submit" class="<?php echo $compact ? 'wish-button' : 'button outline'; ?> <?php echo $active?'selected':''; ?>" aria-pressed="<?php echo $active?'true':'false'; ?>" aria-label="<?php echo esc_attr($active?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'); ?>"><?php echo $compact ? '♡' : ($active?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'); ?></button></form>
    <?php return ob_get_clean();
}
function mhc_wishlist_action() {
    if (!wp_verify_nonce(mhc_scalar($_POST,'mhc_nonce'),'mhc_wishlist')) { wp_die('درخواست معتبر نیست.','',['response'=>403]); }
    $id=absint($_POST['product_id']??0); $product=function_exists('wc_get_product') ? wc_get_product($id) : false;
    if (!$product || $product->get_status()!=='publish') { wp_die('محصول پیدا نشد.','',['response'=>404]); }
    $ids=mhc_wishlist_ids();
    if (mhc_scalar($_POST,'operation')==='remove') { $ids=array_values(array_diff($ids,[$id])); }
    elseif (mhc_scalar($_POST,'operation')==='add') { $ids[]=$id; }
    else { wp_die('عملیات نامعتبر است.','',['response'=>400]); }
    if(!mhc_wishlist_store($ids)){wp_die('ذخیرهٔ علاقه‌مندی انجام نشد؛ دوباره تلاش کنید.','',['response'=>500,'back_link'=>true]);}
    wp_safe_redirect(wp_get_referer() ?: home_url('/wishlist/')); exit;
}
add_action('admin_post_mhc_wishlist','mhc_wishlist_action');
add_action('admin_post_nopriv_mhc_wishlist','mhc_wishlist_action');
add_shortcode('mh_wishlist',function(){
    if (!function_exists('wc_get_product')) { return '<p>فروشگاه در حال آماده‌سازی است.</p>'; }
    $ids=mhc_wishlist_ids(); ob_start();
    echo '<div class="mhc-wishlist" dir="rtl"><h2>علاقه‌مندی‌های شما</h2><p>برای مهمان تا ۳۰ روز در این مرورگر؛ با ورود در حساب شما نگهداری می‌شود.</p>';
    if (!$ids) { echo '<p>هنوز محصولی انتخاب نکرده‌اید.</p>'; }
    foreach ($ids as $id) {
        $p=wc_get_product($id); if (!$p || $p->get_status()!=='publish') { continue; }
        echo '<article class="mhc-wish-item"><a href="'.esc_url($p->get_permalink()).'">'.wp_kses_post($p->get_image('thumbnail')).'<h3>'.esc_html($p->get_name()).'</h3></a><div>'.wp_kses_post($p->get_price_html()).'</div>';
        $needs_choice=$p->is_type('variable') || (bool)$p->get_meta('_mhc_colors');
        echo '<a class="button dark" href="'.esc_url($needs_choice?$p->get_permalink():$p->add_to_cart_url()).'">'.esc_html($needs_choice?'انتخاب و افزودن به سبد':$p->add_to_cart_text()).'</a>';
        echo mhc_wishlist_button($id); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- helper escapes every field.
        echo '</article>';
    }
    echo '</div>'; return ob_get_clean();
});
// WC owns cart, stock and price; Core only retains non-commerce preference IDs.
