<?php
if (!defined('ABSPATH')) { exit; }
require_once get_template_directory().'/inc/icons.php';
require_once get_template_directory().'/inc/customizer.php';
require_once get_template_directory().'/inc/commerce.php';
add_action('after_setup_theme',function(){
    load_theme_textdomain('mobile-hashtag',get_template_directory().'/languages');
    add_theme_support('title-tag'); add_theme_support('post-thumbnails'); add_theme_support('automatic-feed-links');
    add_theme_support('custom-logo',['height'=>56,'width'=>180,'flex-height'=>true,'flex-width'=>true]);
    add_theme_support('html5',['search-form','comment-form','comment-list','gallery','caption','style','script']);
    add_theme_support('woocommerce',['thumbnail_image_width'=>600,'single_image_width'=>800,'product_grid'=>['default_columns'=>4,'min_columns'=>2,'max_columns'=>4]]);
    add_theme_support('wc-product-gallery-zoom');add_theme_support('wc-product-gallery-lightbox');add_theme_support('wc-product-gallery-slider');
    register_nav_menus(['primary'=>'منوی اصلی','footer_shop'=>'دسترسی سریع پابرگ','footer_help'=>'راهنمای مشتری پابرگ']);
});
add_action('wp_enqueue_scripts',function(){
    wp_enqueue_style('mht-source',get_template_directory_uri().'/assets/css/style.css',[],'1.0.2');
    wp_enqueue_style('mht-wp',get_template_directory_uri().'/assets/css/wordpress.css',['mht-source'],'1.0.2');
    wp_enqueue_script('mht-interface',get_template_directory_uri().'/assets/js/interface.js',[],'1.0.2',['in_footer'=>true,'strategy'=>'defer']);
    $gold=sanitize_hex_color(get_theme_mod('mht_gold','#c9a44c')) ?: '#c9a44c';
    wp_add_inline_style('mht-wp',':root{--gold:'.$gold.'}');
    if (is_singular() && comments_open() && get_option('thread_comments')) { wp_enqueue_script('comment-reply'); }
});
add_action('wp_head',function(){if(!has_site_icon()){echo '<link rel="icon" href="'.esc_url(get_template_directory_uri().'/favicon.png').'" type="image/png">';}});
function mht_asset($path) { return get_template_directory_uri().'/assets/'.ltrim($path,'/'); }
function mht_num($n) { return strtr(number_format_i18n($n),['0'=>'۰','1'=>'۱','2'=>'۲','3'=>'۳','4'=>'۴','5'=>'۵','6'=>'۶','7'=>'۷','8'=>'۸','9'=>'۹']); }
function mht_url($legacy) {
    $p=wp_parse_url($legacy); parse_str($p['query']??'',$q); $name=basename($p['path']??'index.html','.html');
    if ($name==='index') { return home_url('/'); }
    if ($name==='category') { $term=get_term_by('slug',sanitize_title($q['slug']??''),'product_cat'); return $term&&!is_wp_error($term)?get_term_link($term):mht_url('shop.html'); }
    if ($name==='product') { $product=get_page_by_path(sanitize_title($q['slug']??''),OBJECT,'product'); return $product?get_permalink($product):mht_url('shop.html'); }
    if ($name==='article') { $post=get_page_by_path(sanitize_title($q['slug']??''),OBJECT,'post');return $post?get_permalink($post):mht_url('blog.html'); }
    if (function_exists('wc_get_page_permalink') && in_array($name,['shop','cart','checkout','account'],true)) { $base=wc_get_page_permalink($name==='account'?'myaccount':$name); }
    else { $page=get_page_by_path($name);$base=function_exists('mhc_page_url')?mhc_page_url($name):($page?get_permalink($page):home_url('/'.$name.'/')); }
    if ($name==='search') { return add_query_arg(['s'=>$q['q']??'','post_type'=>'product'],home_url('/')); }
    if (isset($q['sort'])) { $q['orderby']=['newest'=>'date','bestselling'=>'popularity','price_asc'=>'price','price_desc'=>'price-desc','popular'=>'rating'][$q['sort']]??'menu_order';unset($q['sort']); }
    return $q?add_query_arg($q,$base):$base;
}
function mht_brand() {
    if (has_custom_logo()) { echo get_custom_logo(); return; }
    echo '<a href="'.esc_url(home_url('/')).'" class="brand" aria-label="موبایل هشتگ، صفحه اصلی"><img src="'.esc_url(mht_asset('images/brand/symbol.svg')).'" width="49" height="56" alt="نشان موبایل هشتگ"><span><strong>موبایل <b>هشتگ</b></strong><small>MOBILE HASHTAG</small></span></a>';
}
function mht_default_nav() {
    foreach (['index.html'=>'خانه','shop.html'=>'فروشگاه','category.html?slug=phones'=>'گوشی موبایل','category.html?slug=accessories'=>'لوازم جانبی','category.html?slug=gadgets'=>'ساعت و گجت','shop.html?sale=1'=>'پیشنهادهای ویژه','blog.html'=>'وبلاگ','about.html'=>'درباره ما','contact.html'=>'تماس با ما'] as $url=>$label) { echo '<a href="'.esc_url(mht_url($url)).'">'.esc_html($label).'</a>'; }
}
function mht_categories_menu() {
    if (!taxonomy_exists('product_cat')) { echo '<a href="'.esc_url(mht_url('contact.html')).'">فروشگاه در حال آماده‌سازی است.</a>'; return; }
    $terms=get_terms(['taxonomy'=>'product_cat','hide_empty'=>false,'orderby'=>'term_id']); if(is_wp_error($terms)){return;}
    foreach($terms as $parent){ if($parent->parent){continue;} echo '<div><a class="mega-title" href="'.esc_url(get_term_link($parent)).'">'.esc_html($parent->name).'</a>';foreach($terms as $child){if($child->parent===$parent->term_id){echo '<a href="'.esc_url(get_term_link($child)).'">'.esc_html($child->name).'</a>';}}echo '</div>'; }
}
function mht_post_card($post) {
    $id=is_object($post)?$post->ID:absint($post);
    echo '<article class="blog-card"><a href="'.esc_url(get_permalink($id)).'">'.get_the_post_thumbnail($id,'large',['loading'=>'lazy']).'</a><div><span class="overline">راهنمای خرید · مجله هشتگ</span><h3><a href="'.esc_url(get_permalink($id)).'">'.esc_html(get_the_title($id)).'</a></h3><p>'.esc_html(get_the_excerpt($id)).'</p><a class="text-link" href="'.esc_url(get_permalink($id)).'">بیشتر بخوانید '.mht_icon('arrow').'</a></div></article>';
}
add_action('template_redirect',function(){
    // Native endpoints retain authentication/order ownership checks; never expose arbitrary order IDs.
    $path=basename(wp_parse_url($_SERVER['REQUEST_URI']??'',PHP_URL_PATH) ?: '');
    if (!preg_match('/^(index|shop|category|product|cart|checkout|account|login|register|wishlist|contact|about|blog|article|faq|tracking|search|privacy|terms|order)\.html$/',$path)) { return; }
    if ($path==='order.html') { $dest=mht_url('account.html'); }
    else {
        $allowed=[]; foreach(['slug','q','brand','sale','sort'] as $key){if(isset($_GET[$key])&&is_scalar($_GET[$key])){$allowed[$key]=sanitize_text_field(wp_unslash($_GET[$key]));}}
        $dest=mht_url($path.($allowed?'?'.http_build_query($allowed):''));
    }
    wp_safe_redirect($dest,301);exit;
});
// The approved storefront is Persian even when the host lacks the optional admin language pack.
add_filter('language_attributes',function($attributes){return is_admin() ? $attributes : 'lang="fa-IR" dir="rtl"';});

add_action('admin_notices',function(){
    if(!current_user_can('activate_plugins')){return;}
    if(!function_exists('mhc_settings')){echo '<div class="notice notice-warning"><p dir="rtl">برای تنظیم اطلاعات تماس، ذخیرهٔ پیام‌ها، علاقه‌مندی و ورود کاتالوگ، افزونهٔ همراه Mobile Hashtag Core را از فایل ZIP جداگانه نصب و فعال کنید.</p></div>';}
    if(!class_exists('WooCommerce')&&!function_exists('mhc_settings')){echo '<div class="notice notice-warning"><p dir="rtl">فروشگاه به افزونهٔ رسمی WooCommerce نیاز دارد. آن را از افزونه‌ها ← افزودن نصب و فعال کنید.</p></div>';}
});
