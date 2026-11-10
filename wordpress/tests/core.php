<?php
require '/wordpress/wp-load.php';
require_once ABSPATH.'wp-admin/includes/plugin.php';
$tests=[];
function check_test($name,$ok,$details=null){global $tests;$tests[]=['name'=>$name,'pass'=>(bool)$ok,'details'=>$details];}
wp_set_current_user(1);
check_test('Core activated',is_plugin_active('mobile-hashtag-core/mobile-hashtag-core.php'));
check_test('Actual WordPress version',get_bloginfo('version')==='7.1.4',get_bloginfo('version'));
check_test('PHP runtime',PHP_VERSION_ID>=80100,PHP_VERSION);
check_test('Demo phone disabled',mhc_contact_href('phone','+1 202 555 0142')==='');
$s=mhc_settings();$s['mode']='live';
check_test('Reserved phone disabled even live',mhc_contact_href('phone','+1 202 555 0142',$s)==='');
check_test('Reserved domain disabled even live',mhc_contact_href('email','hello@mobile-hashtag.example',$s)==='');
check_test('Malformed telephone rejected',mhc_contact_href('phone','javascript:alert(1)',$s)==='');
check_test('Valid live telephone href',mhc_contact_href('phone','+49 30 12345678',$s)==='tel:+493012345678');
if(!class_exists('WooCommerce')){check_test('Unconfigured WC migration fails gracefully',is_wp_error(mhc_import_batch()));}else{wp_set_current_user(0);check_test('Unauthorized migration fails gracefully',is_wp_error(mhc_import_batch()));wp_set_current_user(1);}
check_test('Contact shortcode independent of theme',str_contains(do_shortcode('[mh_contact_form]'),'name="mhc_nonce"'));
check_test('Newsletter consent',str_contains(do_shortcode('[mh_newsletter]'),'name="consent"'));
$base=['type'=>'contact','name'=>'آزمون هشتگ','email'=>'qa@example.test','phone'=>'','message'=>'این یک پیام آزمایشی برای بررسی ذخیرهٔ واقعی است.','consent'=>'1','website'=>'','source_url'=>home_url('/contact/?private=secret')];
$bad=$base;$bad['email']='bad';check_test('Invalid email rejected',is_wp_error(mhc_save_submission($bad)));
$bad=$base;$bad['message']='کم';check_test('Short message rejected',is_wp_error(mhc_save_submission($bad)));
$bad=$base;$bad['website']='bot';check_test('Honeypot rejected',is_wp_error(mhc_save_submission($bad)));
$bad=$base;unset($bad['consent']);check_test('Missing consent rejected',is_wp_error(mhc_save_submission($bad)));
$_SERVER['REMOTE_ADDR']='127.0.0.2';
$key='mhc_rate_'.hash_hmac('sha256',$_SERVER['REMOTE_ADDR'],wp_salt('nonce'));delete_transient($key);
$result=mhc_save_submission($base);check_test('Submission inserted',is_array($result)&&$result['id']>0,$result);
global $wpdb;
$row=is_array($result)?$wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}mh_submissions WHERE id=%d",$result['id']),ARRAY_A):[];
check_test('Actual persisted message',$row&&$row['message']===$base['message']);
check_test('Source query secrets removed',$row&&!str_contains($row['source_url'],'secret'));
check_test('Mail disabled without recipient',$row&&$row['mail_status']==='disabled');
$settings=mhc_settings();$withRecipient=$settings;$withRecipient['recipient']='admin@qa-mail.invalid-domain.org';update_option('mhc_settings',$withRecipient);
$fail=function(){return false;};add_filter('pre_wp_mail',$fail);
$result2=mhc_save_submission($base);remove_filter('pre_wp_mail',$fail);update_option('mhc_settings',$settings);
check_test('Mail failure does not lose submission',is_array($result2)&&$result2['mail_status']==='failed',$result2);
$bad=$base;$bad['message']='<script>alert(1)</script> این پیام طول کافی دارد';$result3=mhc_save_submission($bad);
$stored=is_array($result3)?$wpdb->get_var($wpdb->prepare("SELECT message FROM {$wpdb->prefix}mh_submissions WHERE id=%d",$result3['id'])):'';
check_test('Stored XSS stripped',!str_contains($stored,'<script'));
$where=mhc_submission_where(['s'=>"' OR 1=1 --",'status'=>'completed','from'=>'2026-11-01']);check_test('Prepared search escapes injection',str_contains($where,'LIKE')&&!str_contains($where,"LIKE '%' OR 1=1"),$where);
set_transient($key,8,HOUR_IN_SECONDS);$blocked=mhc_save_submission($base);check_test('Rate limit rejects ninth',is_wp_error($blocked)&&$blocked->get_error_code()==='rate');delete_transient($key);
foreach([$result,$result2,$result3] as $testRow){if(is_array($testRow)){$wpdb->delete($wpdb->prefix.'mh_submissions',['id'=>$testRow['id']]);}}
check_test('Woo unit registry independent of theme',apply_filters('woocommerce_currencies',[])['IRT']==='تومان ایران');
check_test('No silent currency conversion',apply_filters('woocommerce_currency_symbol','IRR','IRR')==='ریال');
$failed=count(array_filter($tests,fn($t)=>!$t['pass']));
echo wp_json_encode(['passed'=>count($tests)-$failed,'failed'=>$failed,'tests'=>$tests],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
exit($failed?1:0);
