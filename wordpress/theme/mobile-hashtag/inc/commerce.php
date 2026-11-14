<?php
if (!defined('ABSPATH')) { exit; }
/**
 * Prices are rendered exactly like the approved storefront: struck-through regular price
 * above, bold current price below, "تومان" as a small currency suffix.
 */
function mht_price_block($p) {
    if(!$p || !$p->is_in_stock()) { return '<strong>ناموجود</strong>'; }
    $current = (float) $p->get_price();
    $regular = (float) $p->get_regular_price();
    $sale = $p->is_on_sale() && $regular > $current;
    $money = function ($amount) {
        $formatted = wc_price($amount, ['decimals'=>0, 'price_format'=>'%2$s %1$s']);
        $formatted = wp_strip_all_tags($formatted);
        $formatted = str_replace(['&nbsp;','&#8236;','تومان'], [' ','',''], $formatted);
        $formatted = trim(str_replace('IRT','', $formatted));
        return '<span class="amount">'.esc_html(mht_num((float) preg_replace('/[^0-9.]/','',$formatted))).'</span> <span class="currency">تومان</span>';
    };
    return ($sale ? '<del>'.$money($regular).'</del>' : '<span class="price-spacer"></span>').'<strong>'.$money($current).'</strong>';
}
function mht_product_card($p=null) {
    if(!function_exists('wc_get_product')){return;} if(!$p){global $product;$p=$product;}if(!$p||!$p->is_visible()){return;}
    $id=$p->get_id();$colors=$p->get_meta('_mhc_colors');$select=$p->is_type('variable')||(is_array($colors)&&$colors);
    $brand=wp_strip_all_tags(mht_product_brand_list($id));
    $rating=$p->get_average_rating();
    ?>
    <article <?php wc_product_class('product-card',$p); ?>><div class="product-visual"><a href="<?php echo esc_url($p->get_permalink()); ?>" tabindex="-1" aria-hidden="true"><?php echo $p->get_image('woocommerce_thumbnail',['loading'=>'lazy']); ?></a>
    <?php if($p->is_on_sale()&&(float)$p->get_regular_price()>0): ?><span class="discount"><?php echo esc_html(mht_num(round((1-(float)$p->get_price()/(float)$p->get_regular_price())*100))); ?>٪</span><?php endif; ?>
    <?php if(function_exists('mhc_wishlist_button')){echo mhc_wishlist_button($id,true);} ?>
    <button class="quick-button" type="button" data-quick-id="<?php echo esc_attr($id); ?>"><?php echo mht_icon('eye'); ?> مشاهده سریع</button>
    <template><div class="quick-view"><?php echo $p->get_image('woocommerce_single'); ?><div><span class="overline"><?php echo esc_html($brand); ?></span><h2><?php echo esc_html($p->get_name()); ?></h2><p><?php echo esc_html(wp_strip_all_tags($p->get_short_description())); ?></p><div class="detail-price"><?php echo wp_kses_post($p->get_price_html()); ?></div><a class="button dark" href="<?php echo esc_url($p->get_permalink()); ?>">مشاهده و انتخاب محصول</a></div></div></template>
    </div><div class="product-info"><div class="product-meta"><span><?php echo esc_html($brand); ?></span><?php if($p->get_rating_count()): ?><span class="rating"><?php echo mht_icon('star'); ?> <?php echo esc_html(mht_num($rating)); ?></span><?php endif; ?></div>
    <h3><a href="<?php echo esc_url($p->get_permalink()); ?>"><?php echo esc_html($p->get_name()); ?></a></h3><div class="product-bottom">
    <a class="add-button" href="<?php echo esc_url($select?$p->get_permalink():$p->add_to_cart_url()); ?>" aria-label="<?php echo esc_attr(($select?'انتخاب محصول: ':'افزودن به سبد: ').$p->get_name()); ?>"><?php echo mht_icon('cart'); ?></a><div class="price"><?php echo mht_price_block($p); ?></div></div></div></article>
    <?php
}
function mht_product_brand_list($id) {
    if(taxonomy_exists('product_brand')){$terms=get_the_term_list($id,'product_brand','','، ','');return is_wp_error($terms)?'':($terms ?: '');}
    return get_post_meta($id,'_mhc_brand',true);
}
function mht_home_products($category,$limit,$sort) {
    if(!function_exists('wc_get_products')){echo '<p class="muted">برای نمایش محصولات، ووکامرس را فعال کنید.</p>';return;}
    $args=['status'=>'publish','limit'=>$limit,'orderby'=>'menu_order','order'=>'ASC'];
    if($category){$args['category']=[$category];}
    if($sort==='sale'){$args['include']=wc_get_product_ids_on_sale() ?: [0];}
    if($sort==='newest'){$args['orderby']='date';$args['order']='DESC';}
    if($sort==='bestselling'){$args['orderby']='popularity';$args['order']='DESC';}
    if($sort==='price'){$args['orderby']='price';}
    if($sort==='popular'&&!empty($_GET['phone_brand'])&&is_scalar($_GET['phone_brand'])){$args['mh_brand']=sanitize_text_field(wp_unslash($_GET['phone_brand']));}
    $products=wc_get_products($args);foreach($products as $p){mht_product_card($p);}if(!$products){echo '<p class="muted">در این انتخاب فعلاً محصولی موجود نیست.</p>';}
}
add_filter('woocommerce_product_data_store_cpt_get_products_query',function($query,$vars){
    if(!empty($vars['mh_brand'])){if(taxonomy_exists('product_brand')){$query['tax_query'][]=['taxonomy'=>'product_brand','field'=>'name','terms'=>sanitize_text_field($vars['mh_brand'])];}else{$query['meta_query'][]=['key'=>'_mhc_brand','value'=>sanitize_text_field($vars['mh_brand'])];}}return $query;
},10,2);
function mht_home_categories() {
    $cats=[['phones','گوشی موبایل','iphone'],['headphones','هدفون','headphones'],['smartwatches','ساعت هوشمند','watch'],['airpods','ایرپاد','airpods'],['powerbanks','پاوربانک','powerbank'],['wall-chargers','شارژر و کابل','charger'],['cases','قاب و کاور','case'],['speakers','اسپیکر','speaker'],['tablets','تبلت','tablet'],['cables','کابل شارژ','cable'],['gaming','تجهیزات گیمینگ','gamepad'],['memory-cards','کارت حافظه','memory']];
    foreach($cats as [$slug,$label,$image]){echo '<a class="category-card" href="'.esc_url(mht_url('category.html?slug='.$slug)).'"><div><img src="'.esc_url(mht_asset('images/categories/'.$image.'.webp')).'" alt="'.esc_attr($label).'" width="240" height="240" loading="lazy"></div><span>'.esc_html($label).'</span></a>';}
}
function mht_brands() {foreach(['Apple','Samsung','Xiaomi','Sony','Anker','JBL'] as $brand){echo '<a href="'.esc_url(mht_url('shop.html?brand='.$brand)).'" aria-label="محصولات '.esc_attr($brand).'"><img src="'.esc_url(mht_asset('images/brand/'.strtolower($brand).'.svg')).'" alt="'.esc_attr($brand).'" loading="lazy" width="150" height="44"></a>';}}
add_action('woocommerce_product_query',function($q){
    $meta=$q->get('meta_query') ?: [];$tax=$q->get('tax_query') ?: [];
    if(isset($_GET['instock'])&&$_GET['instock']==='1'){$meta[]=['key'=>'_stock_status','value'=>'instock'];}
    if(isset($_GET['brand'])&&is_scalar($_GET['brand'])&&$_GET['brand']!==''){
        $brand=sanitize_text_field(wp_unslash($_GET['brand']));
        if(taxonomy_exists('product_brand')){$tax[]=['taxonomy'=>'product_brand','field'=>'name','terms'=>$brand];}else{$meta[]=['key'=>'_mhc_brand','value'=>$brand];}
    }
    if(isset($_GET['sale'])&&$_GET['sale']==='1'){$q->set('post__in',wc_get_product_ids_on_sale() ?: [0]);}
    $q->set('meta_query',$meta);$q->set('tax_query',$tax);
});
add_filter('loop_shop_per_page',function(){return 12;});
add_filter('woocommerce_add_to_cart_fragments',function($fragments){if(WC()->cart){$fragments['#cart-count']='<b id="cart-count">'.esc_html(mht_num(WC()->cart->get_cart_contents_count())).'</b>';}return $fragments;});
add_action('wp',function(){
    if(!function_exists('is_product')||!is_product()){return;}
    foreach(['woocommerce_template_single_title'=>5,'woocommerce_template_single_rating'=>10,'woocommerce_template_single_excerpt'=>20,'woocommerce_template_single_meta'=>40] as $fn=>$priority){remove_action('woocommerce_single_product_summary',$fn,$priority);}
});
add_action('woocommerce_after_single_product_summary',function(){
    if(!function_exists('wc_get_product')){return;}
    $ids=array_reverse(array_filter(array_map('absint',explode('|',wp_unslash($_COOKIE['woocommerce_recently_viewed']??'')))));
    $ids=array_values(array_diff($ids,[get_the_ID()]));if(!$ids){return;}
    echo '<section class="section"><div class="section-heading"><h2>به‌تازگی دیده‌اید</h2></div><div class="product-grid">';
    foreach(array_slice($ids,0,4) as $id){$p=wc_get_product($id);if($p){mht_product_card($p);}}echo '</div></section>';
},30);
// Keep the native gallery slider consistent even on hosts without a WordPress locale pack.
add_filter('woocommerce_single_product_carousel_options',function($options){$options['rtl']=false;return $options;});

/** Never represent imported demo testimonials as real customer reviews. */
function mht_home_reviews() {
    $reviews=get_comments(['status'=>'approve','post_type'=>'product','type'=>'review','number'=>3,'orderby'=>'comment_date_gmt','order'=>'DESC']);
    if($reviews){foreach($reviews as $review){
        $rating=max(0,min(5,(int)get_comment_meta($review->comment_ID,'rating',true)));
        echo '<blockquote><span class="stars" aria-label="'.esc_attr(mht_num($rating).' از ۵').'">'.esc_html(str_repeat('★',$rating)).'</span><p>'.esc_html(wp_trim_words($review->comment_content,45)).'</p><footer><span class="avatar">'.esc_html(mb_substr($review->comment_author,0,1)).'</span><div>'.esc_html($review->comment_author).'<small><a href="'.esc_url(get_permalink($review->comment_post_ID).'#reviews').'">'.esc_html(get_the_title($review->comment_post_ID)).'</a></small></div></footer></blockquote>';
    }return;}
    foreach([
        ['انتخاب آگاهانه','مشخصات، تصاویر و ویژگی‌های محصولات را پیش از خرید مقایسه کنید.','shop.html','مشاهده محصولات'],
        ['پاسخ به پرسش‌ها','پیش از ثبت سفارش، راهنمای خرید و پرسش‌های متداول را بخوانید.','faq.html','راهنمای خرید'],
        ['تجربهٔ شما ارزشمند است','پس از تجربهٔ محصول، دیدگاه خود را در صفحهٔ همان محصول ثبت کنید.','contact.html','ارتباط با هشتگ'],
    ] as [$title,$text,$url,$label]){echo '<blockquote><strong>'.esc_html($title).'</strong><p>'.esc_html($text).'</p><footer><a class="text-link" href="'.esc_url(mht_url($url)).'">'.esc_html($label).'</a></footer></blockquote>';}
}
