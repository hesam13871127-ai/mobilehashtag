<?php
if (!defined('ABSPATH')) { exit; }
function mhc_catalog() {
    $data = json_decode(file_get_contents(MHC_PATH.'data/catalog.json'), true);
    if (!is_array($data) || ($data['format_version']??0)!==1) { throw new RuntimeException('فایل مهاجرت معتبر نیست.'); }
    return $data;
}
function mhc_import_media($path) {
    if (!preg_match('~^/assets/images/[a-z0-9/_-]+\\.(webp|png|jpg|jpeg)$~i', $path)) { throw new RuntimeException('مسیر تصویر مجاز نیست: '.$path); }
    $source=MHC_PATH.'data/media/'.substr($path,strlen('/assets/images/'));
    if (!is_file($source)) { throw new RuntimeException('تصویر پیدا نشد: '.$path); }
    $key=hash_file('sha256',$source);
    $ids=get_posts(['post_type'=>'attachment','post_status'=>'inherit','numberposts'=>1,'fields'=>'ids','meta_key'=>'_mhc_media_hash','meta_value'=>$key]);
    if ($ids && get_attached_file($ids[0]) && file_exists(get_attached_file($ids[0]))) { return (int)$ids[0]; }
    require_once ABSPATH.'wp-admin/includes/file.php'; require_once ABSPATH.'wp-admin/includes/media.php'; require_once ABSPATH.'wp-admin/includes/image.php';
    $tmp=wp_tempnam(basename($source));
    if (!$tmp || !copy($source,$tmp)) { throw new RuntimeException('کپی تصویر ناموفق بود.'); }
    $id=media_handle_sideload(['name'=>basename($source),'tmp_name'=>$tmp],0,null,['post_title'=>pathinfo($source,PATHINFO_FILENAME)]);
    if (is_wp_error($id)) { @unlink($tmp); throw new RuntimeException($id->get_error_message()); }
    update_post_meta($id,'_mhc_media_hash',$key); update_post_meta($id,'_mhc_source_path',$path);
    return (int)$id;
}
function mhc_import_category($row) {
    $key='mhc_category_'.$row['id']; $id=(int)get_option($key);
    if ($id && !term_exists($id,'product_cat')) { $id=0; }
    if (!$id) {
        $existing=get_term_by('slug',$row['slug'],'product_cat');
        if ($existing) { update_option($key,(int)$existing->term_id,false); return ['id'=>(int)$existing->term_id,'status'=>'linked-existing-category']; }
        $parent=$row['parent_id'] ? (int)get_option('mhc_category_'.$row['parent_id']) : 0;
        if ($row['parent_id'] && !$parent) { throw new RuntimeException('ابتدا دستهٔ والد را وارد کنید.'); }
        $result=wp_insert_term($row['name'],'product_cat',['slug'=>$row['slug'],'parent'=>$parent]);
        if (is_wp_error($result)) { throw new RuntimeException($result->get_error_message()); }
        $id=(int)$result['term_id']; update_option($key,$id,false); update_term_meta($id,'_mhc_source_id',$row['id']);
    }
    if ((int)get_term_meta($id,'_mhc_source_id',true)!==(int)$row['id']) { return ['id'=>$id,'status'=>'linked-existing-category']; }
    if (get_term_meta($id,'_mhc_import_complete',true)) { return ['id'=>$id,'status'=>'skipped']; }
    update_term_meta($id,'thumbnail_id',mhc_import_media($row['image']));
    update_term_meta($id,'_mhc_import_complete',1);
    return ['id'=>$id,'status'=>'imported'];
}
function mhc_import_product($row,$data) {
    if (empty($row['name']) || empty($row['sku']) || !isset($row['price']) || !is_numeric($row['price']) || $row['price'] < 0 || empty($row['image'])) { throw new RuntimeException('اطلاعات ضروری محصول ناقص است؛ منتشر نشد.'); }
    if (($row['type'] ?? 'simple') !== 'simple') { throw new RuntimeException('نوع محصول در کاتالوگ فعلی پشتیبانی نمی‌شود؛ به محصول ساده تبدیل نشد. محصول متغیر را با ابزار بومی WooCommerce وارد کنید.'); }
    $key='mhc_product_'.$row['id']; $id=(int)get_option($key); $p=$id?wc_get_product($id):false;
    // Idempotent: if already imported and marked complete, skip without changes.
    if ($p && get_post_meta($id,'_mhc_import_complete',true)) { return ['id'=>$id,'status'=>'skipped']; }
    if (!$p) {
        // Check for conflicts only when creating a new product.
        if (wc_get_product_id_by_sku($row['sku']) || get_page_by_path($row['slug'],OBJECT,'product')) { throw new RuntimeException('تداخل SKU یا slug موجود؛ بدون تغییر: '.$row['sku']); }
        $p=new WC_Product_Simple(); $p->set_name($row['name']); $p->set_slug($row['slug']); $p->set_sku($row['sku']);
        $p->set_status('draft'); $p->set_description($row['description']); $p->set_short_description($row['short_description']);
        $p->set_regular_price((string)($row['old_price']>$row['price']?$row['old_price']:$row['price']));
        if ($row['old_price']>$row['price']) { $p->set_sale_price((string)$row['price']); }
        $p->set_manage_stock(true); $p->set_stock_quantity((int)$row['stock']); $p->set_stock_status($row['stock']?'instock':'outofstock');
        $p->set_featured((bool)$row['featured']); $p->set_reviews_allowed(true);
        $attrs=[]; $specs=json_decode($row['specs'],true) ?: []; $specs['برند']=$row['brand'];
        $colors=json_decode($row['colors'],true) ?: []; if ($colors) { $specs['رنگ']=$colors; }
        foreach ($specs as $name=>$values) { $attr=new WC_Product_Attribute(); $attr->set_name($name); $attr->set_options(is_array($values)?$values:[$values]); $attr->set_visible(true); $attr->set_variation(false); $attrs[]=$attr; }
        $p->set_attributes($attrs); $p->update_meta_data('_mhc_source_id',$row['id']); $p->update_meta_data('_mhc_source_sales_sample',(int)$row['sales']); $p->update_meta_data('_mhc_source_rating_sample',(float)$row['rating']);
        $p->update_meta_data('_mhc_brand',$row['brand']); $p->update_meta_data('_mhc_colors',$colors); $p->update_meta_data('_mhc_source_currency','IRT');
        $id=$p->save(); update_option($key,$id,false);
    }
    // Always re-apply categories, images, and status on re-run to ensure consistency.
    $cats=[];
    foreach ($data['product_categories'] as $rel) { if ((int)$rel['product_id']===(int)$row['id']) { $cat=(int)get_option('mhc_category_'.$rel['category_id']); if (!$cat) { throw new RuntimeException('دستهٔ محصول هنوز وارد نشده است.'); } $cats[]=$cat; } }
    $p->set_category_ids(array_unique($cats)); $p->set_image_id(mhc_import_media($row['image']));
    $gallery=[]; foreach (json_decode($row['gallery'],true) ?: [] as $path) { $gallery[]=mhc_import_media($path); }
    $p->set_gallery_image_ids(array_values(array_diff(array_unique($gallery),[$p->get_image_id()])));
    if (taxonomy_exists('product_brand')) { $brand_result=wp_set_object_terms($id,$row['brand'],'product_brand'); if(is_wp_error($brand_result)){throw new RuntimeException($brand_result->get_error_message());} }
    $p->set_status('publish'); $p->update_meta_data('_mhc_import_complete',1); $p->save();
    return ['id'=>$id,'status'=>'imported'];
}
function mhc_import_post($row) {
    $key='mhc_post_'.$row['id']; $id=(int)get_option($key);
    if ($id && get_post($id) && get_post_meta($id,'_mhc_import_complete',true)) { return ['id'=>$id,'status'=>'skipped']; }
    if (!$id || !get_post($id)) {
        if (get_page_by_path($row['slug'],OBJECT,'post')) { throw new RuntimeException('نوشته با این slug وجود دارد؛ تغییر نکرد.'); }
        $content=''; foreach (explode("\n",$row['body']) as $i=>$line) { $tag=$i%2===0?'h2':'p'; $content.="<$tag>".esc_html($line)."</$tag>\n"; }
        $id=wp_insert_post(['post_type'=>'post','post_status'=>'draft','post_name'=>$row['slug'],'post_title'=>$row['title'],'post_excerpt'=>$row['excerpt'],'post_content'=>$content],true);
        if (is_wp_error($id)) { throw new RuntimeException($id->get_error_message()); }
        update_option($key,(int)$id,false); update_post_meta($id,'_mhc_read_minutes',(int)$row['read_minutes']);
    }
    set_post_thumbnail($id,mhc_import_media($row['image'])); wp_update_post(['ID'=>$id,'post_status'=>'publish']); update_post_meta($id,'_mhc_import_complete',1);
    return ['id'=>$id,'status'=>'imported'];
}
function mhc_page_definitions() {
    return [
        'home'=>['خانه',''], 'shop'=>['فروشگاه',''], 'cart'=>['سبد خرید','[woocommerce_cart]'],
        'checkout'=>['تکمیل سفارش','[woocommerce_checkout]'], 'my-account'=>['حساب کاربری من','[woocommerce_my_account]'], 'account'=>['حساب کاربری','[woocommerce_my_account]'],
        'login'=>['ورود به حساب','[woocommerce_my_account]'], 'register'=>['ثبت‌نام','[woocommerce_my_account]'],
        'tracking'=>['پیگیری سفارش','[woocommerce_order_tracking]'], 'wishlist'=>['علاقه‌مندی‌ها','[mh_wishlist]'],
        'contact'=>['تماس با ما','[mh_contact_details]<div class="contact-layout"><section class="panel"><h2>برایمان بنویسید</h2>[mh_contact_form]</section><aside class="contact-aside"><h2>همراه یک انتخاب بهتر</h2><p>سؤال، پیشنهاد یا تجربه‌ای دارید؟ برایمان بنویسید.</p></aside></div>'],
        'about'=>['درباره ما',''], 'faq'=>['پرسش‌های متداول',''], 'privacy'=>['حریم خصوصی',''], 'terms'=>['شرایط خرید و بازگشت',''], 'blog'=>['مجله هشتگ',''],
    ];
}
/**
 * Import or verify a WordPress page.
 * - If page does not exist: create from source with _mhc_created metadata.
 * - If page exists and is unpublished: publish it.
 * - If page exists and is empty (or plugin-owned and needs publishing): fill from source content.
 * - If page exists with user content: never overwrite (respect user edits).
 * - Plugin-owned pages are identified via _mhc_created metadata.
 */
function mhc_import_page_item($slug,$def) {
    $mapped=(int)get_option('mhc_page_'.$slug);
    $existing=$mapped?get_post($mapped):null;
    if (!$existing || $existing->post_type!=='page' || $existing->post_status==='trash') { $existing=get_page_by_path($slug); }
    if ($existing) {
        $needs_publish = ($existing->post_status !== 'publish');
        if ($needs_publish) {
            wp_update_post(['ID'=>$existing->ID,'post_status'=>'publish']);
        }

        // Detect plugin-owned pages via _mhc_created metadata to avoid overwriting user edits.
        $is_plugin_owned = (bool) get_post_meta($existing->ID, '_mhc_created', true);
        $content = trim($existing->post_content);
        $is_empty = ($content === '');

        // If page is empty OR plugin-owned and needs publishing, fill it from source.
        // Never overwrite a page that has real user content and is not plugin-owned.
        if ($is_empty || ($is_plugin_owned && $needs_publish)) {
            $file = MHC_PATH.'data/pages/'.$slug.'.html';
            $new_content = is_file($file) ? file_get_contents($file) : $def[1];
            $new_content = preg_replace_callback('~src="/?(assets/images/[a-z0-9/_-]+\\.(?:webp|png|jpg|jpeg))"~i',function($match){$media=mhc_import_media('/'.$match[1]);return 'src="'.esc_url(wp_get_attachment_url($media)).'"';},$new_content);
            $new_content = preg_replace_callback('~href="/([a-z-]+)/"~',function($match){return 'href="'.esc_url(home_url('/'.$match[1].'/')).'"';},$new_content);
            wp_update_post(['ID'=>$existing->ID,'post_content'=>wp_kses_post($new_content)]);
        }

        update_option('mhc_page_'.$slug,(int)$existing->ID,false);
        return ['id'=>$existing->ID,'status'=>'verified-existing-page'];
    }
    // Page does not exist at all — create it from source.
    $file=MHC_PATH.'data/pages/'.$slug.'.html'; $content=is_file($file)?file_get_contents($file):$def[1];
    $content=preg_replace_callback('~src="/?(assets/images/[a-z0-9/_-]+\\.(?:webp|png|jpg|jpeg))"~i',function($match){$media=mhc_import_media('/'.$match[1]);return 'src="'.esc_url(wp_get_attachment_url($media)).'"';},$content);
    $content=preg_replace_callback('~href="/([a-z-]+)/"~',function($match){return 'href="'.esc_url(home_url('/'.$match[1].'/')).'"';},$content);
    $id=wp_insert_post(['post_type'=>'page','post_status'=>'publish','post_name'=>$slug,'post_title'=>$def[0],'post_content'=>wp_kses_post($content)],true);
    if (is_wp_error($id)) { throw new RuntimeException($id->get_error_message()); }
    update_post_meta($id,'_mhc_created',1); update_option('mhc_page_'.$slug,(int)$id,false);
    return ['id'=>(int)$id,'status'=>'imported'];
}
/**
 * Verify that the import has actually completed by checking real database counts.
 * Only returns true if all expected products, categories, and pages exist and are published.
 */
function mhc_verify_import_complete($data) {
    $expected_products = count($data['products']);
    $expected_categories = count($data['categories']);
    $expected_pages = count(mhc_page_definitions());

    if (!class_exists('WooCommerce')) { return false; }

    // Verify products: count published products that have our source metadata
    $product_ids = get_posts(['post_type'=>'product','post_status'=>'publish','numberposts'=>-1,'fields'=>'ids']);
    $imported_products = 0;
    foreach ($product_ids as $pid) {
        if (get_post_meta($pid, '_mhc_import_complete', true)) { $imported_products++; }
    }

    // Verify categories: count product_cat terms with our source metadata
    $imported_categories = 0;
    foreach ($data['categories'] as $row) {
        $key='mhc_category_'.$row['id'];
        $cat_id=(int)get_option($key);
        if ($cat_id && term_exists($cat_id,'product_cat') && get_term_meta($cat_id,'_mhc_import_complete',true)) { $imported_categories++; }
    }

    // Verify pages: count published pages with our source metadata
    $page_ids = get_posts(['post_type'=>'page','post_status'=>'publish','numberposts'=>-1,'fields'=>'ids']);
    $imported_pages = 0;
    foreach ($page_ids as $pid) {
        if (get_post_meta($pid, '_mhc_created', true)) { $imported_pages++; }
    }

    return ($imported_products >= $expected_products
        && $imported_categories >= $expected_categories
        && $imported_pages >= $expected_pages);
}
/** Resumable batches. Completed objects are never overwritten on retry. */
function mhc_import_batch($offset=0,$limit=5) {
    if (!current_user_can('manage_options') || !current_user_can('manage_woocommerce')) { return new WP_Error('permission','اجازهٔ مهاجرت ندارید.'); }
    if (!class_exists('WooCommerce')) { return new WP_Error('woocommerce','ابتدا ووکامرس رسمی را نصب و فعال کنید.'); }
    if (get_woocommerce_currency()!=='IRT') { return new WP_Error('currency','دادهٔ منبع تومان است. مهاجرت متوقف شد؛ واحد فروشگاه باید IRT باشد. در فروشگاه دارای دادهٔ واقعی، قیمت‌ها را بدون بررسی تغییر ندهید.'); }
    $lock=get_option('mhc_import_lock');
    if ($lock && (int)$lock<time()-300) { delete_option('mhc_import_lock'); }
    if (!add_option('mhc_import_lock',time(),'','no')) { return new WP_Error('locked','یک مهاجرت دیگر در حال اجراست.'); }
    $report=get_option('mhc_import_report',[]);
    try {
        $data=mhc_catalog(); $jobs=[];
        foreach (['categories','products','posts'] as $type) { foreach ($data[$type] as $row) { $jobs[]=[$type,$row]; } }
        foreach (mhc_page_definitions() as $slug=>$def) { $jobs[]=['pages',['slug'=>$slug,'definition'=>$def]]; }
        $offset=max(0,(int)$offset); $limit=max(1,min(10,(int)$limit));
        foreach (array_slice($jobs,$offset,$limit,true) as $index=>$job) {
            [$type,$row]=$job;
            try {
                if ($type==='categories') { $result=mhc_import_category($row); }
                elseif ($type==='products') { $result=mhc_import_product($row,$data); }
                elseif ($type==='posts') { $result=mhc_import_post($row); }
                else { $result=mhc_import_page_item($row['slug'],$row['definition']); }
            } catch (Throwable $error) { $result=['status'=>'failed','error'=>$error->getMessage()]; }
            $report[$index]=array_merge(['type'=>$type,'source'=>$row['slug'],'time'=>current_time('mysql',true)],$result);
            update_option('mhc_import_report',$report,false);
        }
        $next=min(count($jobs),$offset+$limit); update_option('mhc_import_offset',$next,false);
        return ['next'=>$next,'total'=>count($jobs),'report'=>$report];
    } catch (Throwable $error) { return new WP_Error('import',$error->getMessage()); }
    finally { delete_option('mhc_import_lock'); }
}
/**
 * One-time server-side import of the complete reference catalog: categories, products, posts, pages.
 * Automatically sets WooCommerce currency to IRT on an empty store. Idempotent: re-running never creates duplicates.
 * IMPORTANT: mhc_import_complete is set to true ONLY after verifying real database counts match expectations.
 */
function mhc_auto_import() {
    if (!class_exists('WooCommerce')) { return new WP_Error('woocommerce','ابتدا ووکامرس رسمی را نصب و فعال کنید.'); }
    // Auto-switch currency to IRT on an empty store without requiring consent.
    if (get_woocommerce_currency()!=='IRT') {
        $products=get_posts(['post_type'=>'product','post_status'=>'publish','numberposts'=>1,'fields'=>'ids']);
        $orders=wc_get_orders(['limit'=>1,'return'=>'ids']);
        if (!$products && !$orders) {
            update_option('woocommerce_currency','IRT'); update_option('woocommerce_price_num_decimals',0);
        } else {
            return new WP_Error('currency','دادهٔ منبع تومان است و فروشگاه دارای محصول/سفارش است؛ واحد خودکار تغییر نکرد.');
        }
    }
    $lock=get_option('mhc_auto_import_lock');
    if ($lock && (int)$lock<time()-600) { delete_option('mhc_auto_import_lock'); }
    if (!add_option('mhc_auto_import_lock',time(),'','no')) { return new WP_Error('locked','ورود قبلی در حال اجراست.'); }
    $report=[]; $failed=0;
    try {
        $data=mhc_catalog();
        // 1) Categories first (products depend on them)
        foreach ($data['categories'] as $row) {
            try { $r=mhc_import_category($row); }
            catch (Throwable $e) { $r=['status'=>'failed','error'=>$e->getMessage()]; $failed++; }
            $report[]=array_merge(['type'=>'categories','source'=>$row['slug']],$r);
        }
        // 2) Products
        foreach ($data['products'] as $row) {
            try { $r=mhc_import_product($row,$data); }
            catch (Throwable $e) { $r=['status'=>'failed','error'=>$e->getMessage()]; $failed++; }
            $report[]=array_merge(['type'=>'products','source'=>$row['slug']],$r);
        }
        // 3) Posts
        foreach ($data['posts'] as $row) {
            try { $r=mhc_import_post($row); }
            catch (Throwable $e) { $r=['status'=>'failed','error'=>$e->getMessage()]; $failed++; }
            $report[]=array_merge(['type'=>'posts','source'=>$row['slug']],$r);
        }
        // 4) Pages
        foreach (mhc_page_definitions() as $slug=>$def) {
            try { $r=mhc_import_page_item($slug,$def); }
            catch (Throwable $e) { $r=['status'=>'failed','error'=>$e->getMessage()]; $failed++; }
            $report[]=array_merge(['type'=>'pages','source'=>$slug],$r);
        }
        update_option('mhc_import_report',$report,false);
        // CRITICAL: Verify real database state before marking complete.
        // Only mark complete if ZERO failures AND real counts match expectations.
        $verified = ($failed === 0) && mhc_verify_import_complete($data);
        update_option('mhc_import_complete', $verified, false);
        flush_rewrite_rules(true);
        return ['report'=>$report,'failed'=>$failed,'done'=>$verified,'verified'=>$verified];
    } finally { delete_option('mhc_auto_import_lock'); }
}
function mhc_import_page() { mhc_setup_screen(); }
add_action('admin_post_mhc_import',function(){
    if (!current_user_can('manage_options') || !current_user_can('manage_woocommerce')) { wp_die('دسترسی مجاز نیست.','',['response'=>403]); }
    check_admin_referer('mhc_import'); $result=mhc_import_batch(absint($_POST['offset']??0));
    if (is_wp_error($result)) { wp_die(esc_html($result->get_error_message()),'', ['response'=>422,'back_link'=>true]); }
    wp_safe_redirect(admin_url('admin.php?page=mhc-import')); exit;
});
// Preserve source simple-product color choice without creating fictitious per-color stock.
add_action('woocommerce_before_add_to_cart_button',function(){
    global $product; if (!$product || !$product->is_type('simple')) { return; }
    $colors=$product->get_meta('_mhc_colors'); if (!is_array($colors)||!$colors) { return; }
    echo '<label>انتخاب رنگ <select name="mhc_color" required><option value="">انتخاب کنید</option>';
    foreach ($colors as $color) { echo '<option value="'.esc_attr($color).'">'.esc_html($color).'</option>'; } echo '</select></label>';
});
add_filter('woocommerce_add_to_cart_validation',function($valid,$id){
    $p=wc_get_product($id); $colors=$p?$p->get_meta('_mhc_colors'):[];
    if ($p && $p->is_type('simple') && is_array($colors) && $colors && !in_array(sanitize_text_field(wp_unslash(mhc_scalar($_REQUEST,'mhc_color'))),$colors,true)) { wc_add_notice('لطفاً رنگ محصول را انتخاب کنید.','error'); return false; }
    return $valid;
},10,2);
add_filter('woocommerce_add_cart_item_data',function($data,$id){
    $p=wc_get_product($id); $color=sanitize_text_field(wp_unslash(mhc_scalar($_REQUEST,'mhc_color')));
    if ($p && in_array($color,(array)$p->get_meta('_mhc_colors'),true)) { $data['mhc_color']=$color; } return $data;
},10,2);
add_filter('woocommerce_get_item_data',function($data,$item){ if (isset($item['mhc_color'])) { $data[]=['name'=>'رنگ','value'=>$item['mhc_color']]; } return $data; },10,2);
add_action('woocommerce_checkout_create_order_line_item',function($item,$key,$values){ if (isset($values['mhc_color'])) { $item->add_meta_data('رنگ',$values['mhc_color'],true); } },10,3);
add_action('init',function(){
    if (post_type_exists('product') && !taxonomy_exists('product_brand')) {
        register_taxonomy('product_brand',['product'],['label'=>'برندها','public'=>true,'show_ui'=>true,'show_in_rest'=>true,'hierarchical'=>false,'rewrite'=>['slug'=>'product-brand']]);
    }
},30);
