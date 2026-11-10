<?php
/** Approved three-column layout; official WC gallery/forms/tabs/review/related hooks. */
if(!defined('ABSPATH')){exit;}global $product;
do_action('woocommerce_before_single_product');
if(post_password_required()){echo get_the_password_form();return;}
?>
<div id="product-<?php the_ID(); ?>" <?php wc_product_class('mht-single',$product); ?>>
<div class="product-detail"><div class="product-gallery"><?php do_action('woocommerce_before_single_product_summary'); ?><p class="gallery-caption">تصاویر کاتالوگ نمونه؛ مشخصات نهایی را پیش از خرید تأیید کنید.</p></div>
<div class="detail-info"><span class="overline"><?php echo esc_html(wp_strip_all_tags(mht_product_brand_list($product->get_id()))); ?></span><?php woocommerce_template_single_title();woocommerce_template_single_rating();woocommerce_template_single_excerpt();woocommerce_template_single_meta(); ?>
<div class="detail-specs"><?php $n=0;foreach($product->get_attributes() as $attr){if(!$attr->get_visible()){continue;}echo '<div><span>'.esc_html(wc_attribute_label($attr->get_name())).':</span> '.esc_html($product->get_attribute($attr->get_name())).'</div>';if(++$n>=4){break;}} ?></div><a class="text-link gold" href="#tab-additional_information">همه مشخصات فنی</a></div>
<aside class="buy-panel"><div class="summary entry-summary"><?php do_action('woocommerce_single_product_summary'); ?></div>
<?php if(function_exists('mhc_wishlist_button')){echo mhc_wishlist_button($product->get_id());} ?>
<div class="buy-benefits"><span><?php echo mht_icon('shield'); ?> مشخصات و گارانتی را بررسی کنید</span><span><?php echo mht_icon('truck'); ?> هزینهٔ ارسال در تسویه محاسبه می‌شود</span><a href="<?php echo esc_url(mht_url('terms.html')); ?>"><?php echo mht_icon('refresh'); ?> شرایط خرید و بازگشت</a></div></aside></div>
<?php do_action('woocommerce_after_single_product_summary'); ?></div>
<?php do_action('woocommerce_after_single_product'); ?>
