<?php
// Development fixtures only; NEVER packaged. Run against the isolated final ZIP test site.
require '/wordpress/wp-load.php';wp_set_current_user(1);$results=[];
function final_check($name,$pass){global $results;$results[]=['name'=>$name,'pass'=>(bool)$pass];}
final_check('Core 1.0.1 installed from ZIP',MHC_VERSION==='1.0.1');final_check('Theme 1.0.1 installed from ZIP',wp_get_theme()->get('Version')==='1.0.1');
// Adapt previously imported public page content to the new isolated QA origin only.
foreach(get_posts(['post_type'=>['page','post'],'numberposts'=>-1,'post_status'=>'publish']) as $post){$new=str_replace('https://zip-install.example.test',home_url(),$post->post_content);if($new!==$post->post_content){wp_update_post(['ID'=>$post->ID,'post_content'=>$new]);}}
update_option('woocommerce_checkout_privacy_policy_text','اطلاعات شما برای پردازش سفارش و پشتیبانی استفاده می‌شود؛ جزئیات در [privacy_policy].');
update_option('woocommerce_registration_privacy_policy_text','اطلاعات شما برای مدیریت حساب و سفارش‌ها استفاده می‌شود؛ جزئیات در [privacy_policy].');
update_option('woocommerce_enable_reviews','yes');update_option('woocommerce_enable_review_rating','yes');update_option('woocommerce_review_rating_verification_required','no');
$_SERVER['REMOTE_ADDR']='127.0.0.73';$key='mhc_rate_'.hash_hmac('sha256',$_SERVER['REMOTE_ADDR'],wp_salt('nonce'));delete_transient($key);
$base=['type'=>'contact','name'=>'آزمون تلفن','phone'=>'09120000000','email'=>'','message'=>'پیام آزمون تماس بدون ایمیل اختیاری','consent'=>'1','website'=>'','source_url'=>home_url('/contact/')];
$r=mhc_save_submission($base);final_check('Optional email: valid telephone-only contact persists',is_array($r));if(is_array($r)){mhc_change_submission($r['id'],'delete','',true);}
$base['phone']='';final_check('Missing both contact methods rejected',is_wp_error(mhc_save_submission($base)));$base['type']='newsletter';$base['phone']='09120000000';final_check('Newsletter still requires email',is_wp_error(mhc_save_submission($base)));delete_transient($key);
if(!get_option('mhc_final_variable')){
 $p=new WC_Product_Variable();$p->set_name('محصول متغیر آزمون — ارسال واقعی ندارد');$p->set_slug('mh-qa-variable');$p->set_status('publish');$p->set_catalog_visibility('hidden');$p->set_description('محصول موقت برای بررسی انتخاب متغیر بومی ووکامرس.');$source=wc_get_product((int)get_option('mhc_product_1'));$p->set_image_id($source->get_image_id());$p->set_reviews_allowed(true);
 $a=new WC_Product_Attribute();$a->set_name('رنگ');$a->set_options(['طلایی','مشکی']);$a->set_visible(true);$a->set_variation(true);$p->set_attributes([$a]);$p->save();
 foreach(['طلایی'=>'100000','مشکی'=>'120000'] as $color=>$price){$v=new WC_Product_Variation();$v->set_parent_id($p->get_id());$v->set_attributes([sanitize_title('رنگ')=>$color]);$v->set_regular_price($price);$v->set_manage_stock(true);$v->set_stock_quantity(3);$v->save();}
 WC_Product_Variable::sync($p->get_id());update_option('mhc_final_variable',$p->get_id(),false);
}
final_check('Native variable fixture created',wc_get_product(get_option('mhc_final_variable'))->is_type('variable'));
flush_rewrite_rules(false);echo wp_json_encode(['passed'=>count(array_filter($results,fn($r)=>$r['pass'])),'failed'=>count(array_filter($results,fn($r)=>!$r['pass'])),'results'=>$results],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
