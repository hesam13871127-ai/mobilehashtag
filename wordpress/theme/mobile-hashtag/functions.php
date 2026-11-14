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
    wp_enqueue_style('mht-source',get_template_directory_uri().'/assets/css/style.css',[],'1.0.6');
    wp_enqueue_style('mht-wp',get_template_directory_uri().'/assets/css/wordpress.css',['mht-source'],'1.0.6');
    wp_enqueue_script('mht-interface',get_template_directory_uri().'/assets/js/interface.js',[],'1.0.6',['in_footer'=>true,'strategy'=>'defer']);
    $gold=sanitize_hex_color(get_theme_mod('mht_gold','#c9a44c')) ?: '#c9a44c';
    wp_add_inline_style('mht-wp',':root{--gold:'.$gold.'}');
    if (is_singular() && comments_open() && get_option('thread_comments')) { wp_enqueue_script('comment-reply'); }
});
add_action('wp_enqueue_scripts',function(){
    // Icon path set shared with the approved static source so page content <span data-icon> works.
    $paths=['phone'=>'<path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a13 13 0 0 1-7-7l2-2-2-5Z"/>','whatsapp'=>'<path d="M20 11.5a8.5 8.5 0 0 1-12.8 7.4L3 21l1.8-4.4A8.5 8.5 0 1 1 20 11.5Z"/><path d="m8 7 2 2-1 2 3 3 2-1 2 2c-3 4-12-5-8-8Z"/>','clock'=>'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>','instagram'=>'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7"/>','telegram'=>'<path d="m3 10 18-7-4 18-6-6-4 3 1-6 9-5-7 7-7-4Z"/>','search'=>'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>','cart'=>'<path d="M3 3h2l3 12h10l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>','user'=>'<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>','heart'=>'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>','menu'=>'<path d="M4 6h16M4 12h16M4 18h16"/>','grid'=>'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>','shield'=>'<path d="m12 3 8 3v7c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>','truck'=>'<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/>','refresh'=>'<path d="M20 7a9 9 0 1 0 1 9M20 2v5h-5"/>','headset'=>'<path d="M4 14v-3a8 8 0 0 1 16 0v7c0 3-3 4-6 4"/><rect x="2" y="11" width="5" height="8" rx="2"/><rect x="17" y="11" width="5" height="8" rx="2"/>','bolt'=>'<path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>','eye'=>'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>','bag'=>'<path d="M5 7h14l2 15H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>','close'=>'<path d="m5 5 14 14M5 19 19 5"/>','trash'=>'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>','check'=>'<path d="m5 12 4 4L19 6"/>','arrow'=>'<path d="M20 12H4m6-6-6 6 6 6"/>','box'=>'<path d="m12 2 10 5v10l-10 5L2 17V7l10-5ZM2 7l10 5 10-5M12 12v10M7 4l10 5"/>','pin'=>'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>','logout'=>'<path d="M9 3H3v18h6M8 12h13m-5-5 5 5-5 5"/>','star'=>'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>','mail'=>'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>'];
    wp_add_inline_script('mht-interface','window.mhtIconPaths='.wp_json_encode($paths).';','before');
},20);
add_action('wp_head',function(){if(!has_site_icon()){echo '<link rel="icon" href="'.esc_url(get_template_directory_uri().'/favicon.png').'" type="image/png">';}});
function mht_asset($path) { return get_template_directory_uri().'/assets/'.ltrim($path,'/'); }
function mht_num($n) { return strtr(number_format_i18n($n),['0'=>'۰','1'=>'۱','2'=>'۲','3'=>'۳','4'=>'۴','5'=>'۵','6'=>'۶','7'=>'۷','8'=>'۸','9'=>'۹']); }
function mht_url($legacy) {
    $p=wp_parse_url($legacy); parse_str($p['query']??'',$q); $name=basename($p['path']??'index.html','.html');
    if ($name==='index') { return home_url('/'); }
    if ($name==='category') { $term=get_term_by('slug',sanitize_title($q['slug']??''),'product_cat'); return $term&&!is_wp_error($term)?get_term_link($term):mht_url('shop.html'); }
    if ($name==='product') { $product=get_page_by_path(sanitize_title($q['slug']??''),OBJECT,'product'); return $product?get_permalink($product):mht_url('shop.html'); }
    if ($name==='article') { $post=get_page_by_path(sanitize_title($q['slug']??''),OBJECT,'post');return $post?get_permalink($post):mht_url('blog.html'); }
    if (function_exists('wc_get_page_permalink') && in_array($name,['shop','cart','checkout','account','login','register'],true)) { $base=wc_get_page_permalink(in_array($name,['account','login','register'],true)?'myaccount':$name); }
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
