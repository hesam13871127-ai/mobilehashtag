<?php
require '/wordpress/wp-load.php';
wp_set_current_user(1);
if(!class_exists('WooCommerce')){throw new RuntimeException('Real WooCommerce is required; mocks are not permitted.');}
$results=[];function verify($name,$pass,$details=null){global $results;$results[]=['name'=>$name,'pass'=>(bool)$pass,'details'=>$details];}
verify('Genuine WooCommerce initialized',WC()->version==='11.2.2',WC()->version);
// Configuration belongs ONLY to this disposable QA store, not plugin activation/import.
update_option('woocommerce_currency','IRT');update_option('woocommerce_price_num_decimals',0);update_option('woocommerce_currency_pos','right_space');update_option('woocommerce_default_country','IR:THR');
update_option('woocommerce_store_city','شهر نمونه');update_option('woocommerce_store_address','نشانی آزمایشی غیرواقعی');update_option('woocommerce_store_postcode','1111111111');
update_option('woocommerce_coming_soon','no');update_option('woocommerce_enable_myaccount_registration','yes');update_option('woocommerce_registration_generate_password','no');update_option('woocommerce_registration_generate_username','yes');
update_option('woocommerce_enable_guest_checkout','yes');update_option('woocommerce_calc_taxes','no');update_option('woocommerce_cod_settings',['enabled'=>'yes','title'=>'پرداخت هنگام دریافت (آزمون)','description'=>'فقط سفارش آزمون؛ پرداخت یا ارسال واقعی انجام نمی‌شود.','enable_for_methods'=>[],'enable_for_virtual'=>'yes']);
$data=mhc_catalog();$all=[];
for($offset=0;$offset<94;$offset+=5){$r=mhc_import_batch($offset,5);if(is_wp_error($r)){throw new RuntimeException($r->get_error_message());}$all=$r['report'];}
$errors=array_values(array_filter($all,fn($r)=>$r['status']==='failed'));verify('All 94 migration jobs completed',count($all)===94&&!$errors,$errors);
$products=get_posts(['post_type'=>'product','post_status'=>'any','numberposts'=>-1,'meta_key'=>'_mhc_source_id','fields'=>'ids']);verify('28 native products',count($products)===28,count($products));
$terms=get_terms(['taxonomy'=>'product_cat','hide_empty'=>false,'meta_query'=>[['key'=>'_mhc_source_id','compare'=>'EXISTS']]]);verify('47 imported categories',!is_wp_error($terms)&&count($terms)===47,is_wp_error($terms)?$terms->get_error_message():count($terms));
$relations=0;$bad=[];
foreach($data['products'] as $source){
 $id=(int)get_option('mhc_product_'.$source['id']);$p=wc_get_product($id);if(!$p){$bad[]=['source'=>$source['id'],'error'=>'missing'];continue;}
 $expected=[];foreach($data['product_categories'] as $rel){if((int)$rel['product_id']===(int)$source['id']){$expected[]=(int)get_option('mhc_category_'.$rel['category_id']);}}
 $actual=$p->get_category_ids();sort($actual);sort($expected);$relations+=count($actual);
 if($actual!==$expected || (int)$p->get_price()!==(int)$source['price'] || $p->get_sku()!==$source['sku'] || $p->get_slug()!==$source['slug'] || $p->get_stock_quantity()!==(int)$source['stock'] || $p->get_description()!==$source['description']){$bad[]=['source'=>$source['id'],'error'=>'data mismatch'];}
 if(!$p->get_image_id() || !file_exists(get_attached_file($p->get_image_id())) || count($p->get_gallery_image_ids())!==1){$bad[]=['source'=>$source['id'],'error'=>'media mismatch'];}
}
verify('Exact prices/SKUs/slugs/stock/descriptions/relationships/media preserved',!$bad,$bad);verify('91 exact category relationships',$relations===91,$relations);
$badParents=[];foreach($data['categories'] as $source){$term=get_term((int)get_option('mhc_category_'.$source['id']),'product_cat');$expected=$source['parent_id']?(int)get_option('mhc_category_'.$source['parent_id']):0;if(!$term||is_wp_error($term)||(int)$term->parent!==$expected){$badParents[]=$source['slug'];}}
verify('Category hierarchy retained',!$badParents,$badParents);
$posts=[];foreach($data['posts'] as $p){$id=(int)get_option('mhc_post_'.$p['id']);if($id&&get_post_status($id)==='publish'&&get_post_thumbnail_id($id)){$posts[]=$id;}}verify('3 native editable posts with images',count($posts)===3,$posts);
$before=['products'=>count($products),'media'=>(int)wp_count_posts('attachment')->inherit,'terms'=>wp_count_terms(['taxonomy'=>'product_cat','hide_empty'=>false])];
$edited=wc_get_product((int)get_option('mhc_product_1'));$oldName=$edited->get_name();$edited->set_name($oldName.' — آزمون حفظ ویرایش');$edited->save();
for($offset=0;$offset<94;$offset+=10){$r=mhc_import_batch($offset,10);if(is_wp_error($r)){throw new RuntimeException($r->get_error_message());}}
$after=['products'=>count(get_posts(['post_type'=>'product','post_status'=>'any','numberposts'=>-1,'meta_key'=>'_mhc_source_id','fields'=>'ids'])),'media'=>(int)wp_count_posts('attachment')->inherit,'terms'=>wp_count_terms(['taxonomy'=>'product_cat','hide_empty'=>false])];
verify('Retry produces no duplicate products/media/categories',$before===$after,['before'=>$before,'after'=>$after]);$edited=wc_get_product($edited->get_id());verify('Retry preserves administrator edits',$edited->get_name()===$oldName.' — آزمون حفظ ویرایش');$edited->set_name($oldName);$edited->save();
update_option('woocommerce_currency','IRR');$blocked=mhc_import_batch(0,1);verify('Incompatible source unit blocks import',is_wp_error($blocked)&&$blocked->get_error_code()==='currency');update_option('woocommerce_currency','IRT');
if(!get_option('mhc_qa_shipping_zone')){
 $zone=new WC_Shipping_Zone();$zone->set_zone_name('منطقه آزمون ایران');$zone->set_zone_order(0);$zone->add_location('IR','country');$zone->save();
 $flat=$zone->add_shipping_method('flat_rate');update_option('woocommerce_flat_rate_'.$flat.'_settings',['title'=>'ارسال آزمایشی','tax_status'=>'none','cost'=>'69000']);
 $free=$zone->add_shipping_method('free_shipping');update_option('woocommerce_free_shipping_'.$free.'_settings',['title'=>'ارسال رایگان آزمایشی','requires'=>'min_amount','min_amount'=>'5000000','ignore_discounts'=>'no']);update_option('mhc_qa_shipping_zone',$zone->get_id());
}
flush_rewrite_rules(false);
$failed=count(array_filter($results,fn($r)=>!$r['pass']));echo wp_json_encode(['woocommerce'=>WC()->version,'passed'=>count($results)-$failed,'failed'=>$failed,'results'=>$results,'migration_report'=>$all],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);exit($failed?1:0);
