<?php
if (!defined('ABSPATH')) { exit; }
/** Setup is independent of catalog currency/media jobs. Existing content is never overwritten. */
function mhc_page_url($slug) {
    $id=(int)get_option('mhc_page_'.$slug);
    if (!$id || get_post_status($id)!=='publish') { $p=get_page_by_path($slug); $id=$p && $p->post_status==='publish'?$p->ID:0; }
    return $id ? get_permalink($id) : home_url('/'.$slug.'/');
}
/** Convert only official cart/checkout blocks after explicit setup consent. Keep a recoverable backup. */
function mhc_classic_blocks($blocks) {
    foreach ($blocks as &$block) {
        $shortcodes=['woocommerce/cart'=>'[woocommerce_cart]','woocommerce/checkout'=>'[woocommerce_checkout]'];
        if (isset($shortcodes[$block['blockName']])) {
            $text=$shortcodes[$block['blockName']];
            $block=['blockName'=>'core/shortcode','attrs'=>[],'innerBlocks'=>[],'innerHTML'=>$text,'innerContent'=>[$text]];
        } elseif (!empty($block['innerBlocks'])) { $block['innerBlocks']=mhc_classic_blocks($block['innerBlocks']); }
    }
    return $blocks;
}
function mhc_setup_pages($connect=false) {
    if (!current_user_can('manage_options')) { return new WP_Error('permission','دسترسی مجاز نیست.'); }
    if (!add_option('mhc_setup_lock',time(),'','no')) {
        if ((int)get_option('mhc_setup_lock') < time()-300) { delete_option('mhc_setup_lock'); }
        return new WP_Error('locked','راه‌اندازی دیگری در حال اجراست؛ دوباره تلاش کنید.');
    }
    $rows=[];
    try {
        foreach (mhc_page_definitions() as $slug=>$def) {
            try { $rows[$slug]=mhc_import_page_item($slug,$def); }
            catch (Throwable $e) { $rows[$slug]=['status'=>'failed','error'=>$e->getMessage()]; }
        }
        if ($connect) {
            foreach (['cart'=>'woocommerce/cart','checkout'=>'woocommerce/checkout'] as $slug=>$block) {
                $id=(int)($rows[$slug]['id']??0);$post=$id?get_post($id):null;
                if ($post && has_block($block,$post)) {
                    if (!metadata_exists('post',$id,'_mhc_classic_backup_102')) { update_post_meta($id,'_mhc_classic_backup_102',wp_slash($post->post_content)); }
                    $saved=wp_update_post(wp_slash(['ID'=>$id,'post_content'=>serialize_blocks(mhc_classic_blocks(parse_blocks($post->post_content)))]),true);
                    if (is_wp_error($saved)) { $rows[$slug]=['id'=>$id,'status'=>'failed','error'=>$saved->get_error_message()]; }
                    else { $rows[$slug]['classic_conversion']='official-block-only; original saved in _mhc_classic_backup_102'; }
                }
            }
        }
        $map=['page_on_front' =>'home','page_for_posts'=>'blog','wp_page_for_privacy_policy'=>'privacy'];
        if (class_exists('WooCommerce')) { $map+=['woocommerce_shop_page_id'=>'shop','woocommerce_cart_page_id'=>'cart','woocommerce_checkout_page_id'=>'checkout','woocommerce_myaccount_page_id'=>'my-account','woocommerce_terms_page_id'=>'terms']; }
        $connections=[];
        foreach ($map as $option=>$slug) {
            $id=(int)($rows[$slug]['id']??0); $old=(int)get_option($option);
            if (!$id) { continue; }
            // Explicit consent permits switching these settings; other pages remain untouched.
            if ($connect || !$old || get_post_status($old)!=='publish') {
                update_option($option,$id); $connections[$option]=$id;
                if ($option==='page_on_front') { update_option('show_on_front','page'); }
            } else { $connections[$option]=$old; }
        }
        // Flush once during setup, never on every frontend request.
        if (!get_option('permalink_structure')) { update_option('permalink_structure','/%postname%/'); }
        flush_rewrite_rules(true);
        mhc_setup_menus();
        $result=['pages'=>$rows,'connections'=>$connections,'time'=>current_time('mysql',true),'failed'=>count(array_filter($rows,fn($r)=>$r['status']==='failed'))];
        update_option('mhc_setup_report',$result,false);
        if (!$result['failed']) { update_option('mhc_pages_ready',MHC_VERSION.(class_exists('WooCommerce')?'-wc':'-no-wc'),false); }
        if (!$result['failed'] && class_exists('WooCommerce') && !get_option('mhc_import_complete')) {
            mhc_auto_import();
        }
        return $result;
    } finally { delete_option('mhc_setup_lock'); }
}
function mhc_setup_menus() {
    if (get_stylesheet()!=='mobile-hashtag') { return; }
    $locations=get_theme_mod('nav_menu_locations',[]);
    $definitions=[
        'primary'=>['home','shop','@phones','@accessories','@gadgets','@sale','blog','about','contact'],
        'footer_shop'=>['shop','@phones','@accessories','@sale','blog'],
        'footer_help'=>['my-account','tracking','faq','terms','privacy','contact'],
    ];
    foreach ($definitions as $location=>$slugs) {
        if (!empty($locations[$location]) && wp_get_nav_menu_object($locations[$location])) { continue; }
        $id=(int)get_option('mhc_menu_'.$location);
        if (!$id || !wp_get_nav_menu_object($id)) {
            $id=wp_create_nav_menu('هشتگ — '.$location);
            if (is_wp_error($id)) { continue; }
            update_option('mhc_menu_'.$location,$id,false);
            foreach ($slugs as $slug) {
                if (str_starts_with($slug,'@')) {
                    $labels=['@phones'=>'گوشی موبایل','@accessories'=>'لوازم جانبی','@gadgets'=>'ساعت و گجت','@sale'=>'پیشنهادهای ویژه'];
                    $url=$slug==='@sale'?add_query_arg('sale','1',mhc_page_url('shop')):add_query_arg('mhc_category',substr($slug,1),mhc_page_url('shop'));
                    // Mark only generated links; resolved to the real term permalink once imported.
                    $item=wp_update_nav_menu_item($id,0,['menu-item-title'=>$labels[$slug],'menu-item-url'=>$url,'menu-item-type'=>'custom','menu-item-status'=>'publish']);
                    if (!is_wp_error($item)) { update_post_meta($item,'_mhc_nav_target',$slug); }
                } else {
                    $page=(int)get_option('mhc_page_'.$slug); if (!$page) { continue; }
                    wp_update_nav_menu_item($id,0,['menu-item-object-id'=>$page,'menu-item-object'=>'page','menu-item-type'=>'post_type','menu-item-status'=>'publish']);
                }
            }
        }
        $locations[$location]=$id;
    }
    set_theme_mod('nav_menu_locations',$locations);
}
add_filter('wp_nav_menu_objects',function($items){
    foreach ($items as $item) {
        $target=get_post_meta($item->ID,'_mhc_nav_target',true);
        if (!$target) { continue; }
        // Respect a subsequent manual URL edit in Appearance > Menus.
        $url=wp_parse_url($item->url); parse_str($url['query']??'',$query);
        if ($target==='@sale') { continue; }
        if (($query['mhc_category']??'')!==substr($target,1)) { continue; }
        $term=get_term_by('slug',substr($target,1),'product_cat');
        $item->url=$term&&!is_wp_error($term)?get_term_link($term):mhc_page_url('shop');
    }
    return $items;
});
add_action('admin_init',function(){
    if (!current_user_can('manage_options') || wp_doing_ajax() || get_stylesheet()!=='mobile-hashtag') { return; }
    $version=MHC_VERSION.(class_exists('WooCommerce')?'-wc':'-no-wc');
    if (get_option('mhc_pages_ready')!==$version) { mhc_setup_pages(false); }
});
add_action('after_switch_theme',function(){delete_option('mhc_pages_ready');});
function mhc_import_summary($report=null) {
    $summary=[];
    foreach ($report??get_option('mhc_import_report',[]) as $row) {
        $type=$row['type']; if (!isset($summary[$type])) { $summary[$type]=['imported'=>0,'skipped'=>0,'failed'=>0]; }
        $key=$row['status']==='failed'?'failed':($row['status']==='imported'?'imported':'skipped');$summary[$type][$key]++;
    }
    return $summary;
}
/** Never change currency on a populated store, even with an old sample catalog. */
function mhc_setup_currency($consent=false) {
    if (!class_exists('WooCommerce')) { return new WP_Error('woocommerce','ابتدا WooCommerce رسمی را فعال کنید. برگه‌ها مستقل ساخته می‌شوند.'); }
    if (get_woocommerce_currency()==='IRT') { return true; }
    $products=get_posts(['post_type'=>['product','product_variation'],'post_status'=>'any','numberposts'=>1,'fields'=>'ids']);
    $orders=wc_get_orders(['limit'=>1,'return'=>'ids']);
    if (!$consent || $products || $orders) { return new WP_Error('currency','کاتالوگ تومان (IRT) است. واحد پول خودکار تغییر نکرد. برای فروشگاه خالی اجازهٔ تنظیم تومان را انتخاب کنید؛ در فروشگاه دارای محصول/سفارش ابتدا واحد و قیمت‌های فعلی را بررسی کنید.'); }
    update_option('woocommerce_currency','IRT'); update_option('woocommerce_price_num_decimals',0); return true;
}
add_action('admin_notices',function(){
    if (!current_user_can('manage_options')) { return; }
    $summary=mhc_import_summary();$done=($summary['products']['imported']??0)+($summary['products']['skipped']??0);
    $has_products=class_exists('WooCommerce') && get_posts(['post_type'=>'product','post_status'=>'publish','numberposts'=>1,'fields'=>'ids']);
    if ($done>=28 && $has_products && empty(get_option('mhc_setup_report',[])['failed'])) { return; }
    echo '<div class="notice notice-warning"><p dir="rtl"><strong>راه‌اندازی موبایل هشتگ:</strong> نصب قالب به‌تنهایی محصولات را وارد نمی‌کند. برای ساخت/اتصال برگه‌ها و ورود محصولات واقعی، <a class="button button-primary" href="'.esc_url(admin_url('admin.php?page=mhc-setup')).'">راه‌اندازی فروشگاه و ورود کاتالوگ</a> را اجرا کنید. اطلاعات موجود بازنویسی نمی‌شود.</p></div>';
});
function mhc_setup_screen() {
    if (!current_user_can('manage_options')) { return; }
    try { $data=mhc_catalog(); } catch (Throwable $e) { echo '<div class="notice notice-error">'.esc_html($e->getMessage()).'</div>'; return; }
    $report=get_option('mhc_setup_report',[]);$summary=mhc_import_summary();
    ?><div class="wrap" dir="rtl"><h1>راه‌اندازی فروشگاه موبایل هشتگ</h1>
    <p>کاتالوگ بسته: <strong><?php echo esc_html(count($data['products'])); ?> محصول، <?php echo esc_html(count($data['categories'])); ?> دسته و <?php echo esc_html(count($data['posts'])); ?> مقاله</strong>. ورود فقط با تأیید شما آغاز می‌شود. ابتدا پشتیبان بگیرید. محصولات و منوهای قبلی بازنویسی نمی‌شوند؛ تبدیل بلوک تجارت فقط با تأیید گزینهٔ زیر انجام می‌شود.</p>
    <p>برگه‌های ضروری مستقل از محصولات ساخته می‌شوند. راه‌اندازی کاتالوگ در درخواست‌های کوچک به‌صورت خودکار ادامه دارد؛ تا پایان این صفحه را باز نگه دارید. با قطع اتصال، «ادامه» را بزنید. خطاها پنهان نمی‌شوند؛ پس از رفع علت، «بازآزمایی» را بزنید.</p>
    <form id="mhc-setup-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
    <input type="hidden" name="action" value="mhc_setup"><input type="hidden" name="offset" value="<?php echo esc_attr((int)get_option('mhc_import_offset')); ?>"><?php wp_nonce_field('mhc_setup'); ?>
    <p><label><input type="checkbox" name="currency" value="1"> در فروشگاه کاملاً خالی، واحد پول را تومان قرار بده (هرگز قیمت موجود را تبدیل نکن).</label></p>
    <p><label><input type="checkbox" name="connect" value="1"> برگه‌های هشتگ را متصل کن و بلوک رسمی سبد/تسویه را با shortcode رسمی جایگزین کن (با نگهداری نسخهٔ پشتیبان محتوا). سایر محتوای قبلی تغییر نمی‌کند.</label></p>
    <p><button class="button button-primary" name="mode" value="continue">راه‌اندازی کامل / ادامهٔ ورود محصولات</button> <button class="button" name="mode" value="retry">بازآزمایی از ابتدا (بدون تکرار)</button> <button class="button" name="mode" value="pages">فقط ساخت و اتصال صفحات</button></p>
    </form><div id="mhc-setup-progress" role="status" aria-live="polite"></div>
    <h2>نتیجهٔ ورود</h2><pre id="mhc-setup-summary" style="white-space:pre-wrap;direction:ltr"><?php echo esc_html(wp_json_encode($summary,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)); ?></pre>
    <p>imported = واردشده، skipped = از قبل موجود و حفظ‌شده، failed = ناموفق. موفقیت پایان کار فقط وقتی گزارش می‌شود که خطایی وجود نداشته باشد. محصولات ناقص منتشر نمی‌شوند.</p>
    <h2>برگه‌ها و آدرس واقعی</h2><table class="widefat"><thead><tr><th>برگه</th><th>آدرس</th><th>وضعیت</th></tr></thead><tbody>
    <?php foreach(mhc_page_definitions() as $slug=>$def){$id=(int)get_option('mhc_page_'.$slug);echo '<tr><td>'.esc_html($def[0]).'</td><td><a href="'.esc_url(mhc_page_url($slug)).'">'.esc_html(mhc_page_url($slug)).'</a></td><td>'.esc_html($id?get_post_status($id):'ساخته نشده').'</td></tr>';} ?>
    </tbody></table>
    <p>با تأیید گزینهٔ اتصال، فقط بلوک رسمی Cart/Checkout به shortcode تبدیل می‌شود؛ محتوای اصلی در meta خصوصی _mhc_classic_backup_102 و بازبینی‌های وردپرس حفظ می‌شود. بدون تأیید، هیچ محتوای قبلی تغییر نمی‌کند. برگهٔ حساب: [woocommerce_my_account].</p>
    <p>منوهای ساخته‌شده در نمایش ← فهرست‌ها قابل ویرایش‌اند. منوی اختصاصی قبلی جایگزین نمی‌شود. روی Apache دسترسی نوشتن .htaccess و روی Nginx تنظیم استاندارد try_files وردپرس لازم است؛ قالب نمی‌تواند تنظیم سرور را تغییر دهد.</p>
    <details><summary>گزارش جزئی صفحات و خطاها</summary><pre style="white-space:pre-wrap;direction:ltr"><?php echo esc_html(wp_json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)); ?></pre><pre id="mhc-import-details" style="white-space:pre-wrap;direction:ltr"><?php echo esc_html(wp_json_encode(get_option('mhc_import_report',[]),JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)); ?></pre></details></div><?php
    wp_enqueue_script('mhc-setup',plugins_url('assets/setup.js',MHC_PATH.'mobile-hashtag-core.php'),[],MHC_VERSION,true);
    wp_localize_script('mhc-setup','mhcSetup',['url'=>admin_url('admin-ajax.php')]);
}
function mhc_setup_request($input) {
    if (!current_user_can('manage_options') || (mhc_scalar($input,'mode')!=='pages' && !current_user_can('manage_woocommerce'))) { return new WP_Error('permission','دسترسی مدیر فروشگاه لازم است.'); }
    $mode=mhc_scalar($input,'mode');$offset=absint(mhc_scalar($input,'offset'));
    if ($mode!=='batch') {
        $pages=mhc_setup_pages(mhc_scalar($input,'connect')==='1');
        if (is_wp_error($pages)) { return $pages; }
        if ($mode==='pages') { return ['done'=>true,'pages'=>$pages,'failed'=>$pages['failed']]; }
        if ($pages['failed']) { return new WP_Error('pages','برخی برگه‌ها آماده نشدند؛ گزارش صفحات را بررسی کنید. دادهٔ قبلی حفظ شد.'); }
        $currency=mhc_setup_currency(mhc_scalar($input,'currency')==='1'); if (is_wp_error($currency)) { return $currency; }
        if ($mode==='retry') { $offset=0; }
    }
    $result=mhc_import_batch($offset,3); if (is_wp_error($result)) { return $result; }
    $result['summary']=mhc_import_summary($result['report']);
    $result['failed']=count(array_filter($result['report'],fn($r)=>$r['status']==='failed'));
    $result['done']=$result['next']>=$result['total'];
    if ($result['done']) { flush_rewrite_rules(true); }
    return $result;
}
add_action('wp_ajax_mhc_setup',function(){
    check_ajax_referer('mhc_setup','_wpnonce');
    $result=mhc_setup_request(wp_unslash($_POST));
    if (is_wp_error($result)) { wp_send_json_error(['message'=>$result->get_error_message()],$result->get_error_code()==='permission'?403:422); }
    wp_send_json_success($result);
});
add_action('admin_post_mhc_setup',function(){
    check_admin_referer('mhc_setup');$result=mhc_setup_request(wp_unslash($_POST));
    if(is_wp_error($result)){wp_die(esc_html($result->get_error_message()),'راه‌اندازی متوقف شد',['response'=>422,'back_link'=>true]);}
    wp_safe_redirect(admin_url('admin.php?page=mhc-setup'));exit;
});
