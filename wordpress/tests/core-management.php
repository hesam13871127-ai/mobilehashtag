<?php
require '/wordpress/wp-load.php';require_once ABSPATH.'wp-admin/includes/plugin.php';wp_set_current_user(1);
$tests=[];function qa($name,$pass,$detail=null){global $tests;$tests[]=['name'=>$name,'pass'=>(bool)$pass,'detail'=>$detail];}
global $wpdb;$table=$wpdb->prefix.'mh_submissions';$ids=[];$email='privacy-'.wp_generate_uuid4().'@example.test';
$base=['type'=>'inquiry','name'=>'آزمون مدیریت','email'=>$email,'phone'=>'۰۹۱۲۰۰۰۰۰۰۰','message'=>'پیام آزمایشی ذخیره و مدیریت مستقل از پوسته','consent'=>'1','website'=>'','source_url'=>home_url('/contact/?token=private')];
$_SERVER['REMOTE_ADDR']='127.0.0.9';$rate='mhc_rate_'.hash_hmac('sha256',$_SERVER['REMOTE_ADDR'],wp_salt('nonce'));delete_transient($rate);
$before=(int)$wpdb->get_var("SELECT COUNT(*) FROM $table");
foreach(['contact','inquiry','newsletter'] as $type){$base['type']=$type;$r=mhc_save_submission($base);qa($type.' actual insert',is_array($r));if(is_array($r))$ids[]=$r['id'];}
$id=$ids[0];$row=$wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id=%d",$id),ARRAY_A);
qa('UUID / UTC / complete submitted fields',strlen($row['uuid'])===36&&abs(time()-strtotime($row['created_at'].' UTC'))<60&&json_decode($row['fields'],true)['phone']===$base['phone']);
wp_set_current_user(0);qa('Anonymous cannot change record',is_wp_error(mhc_change_submission($id,'update','completed')));wp_set_current_user(1);
qa('Invalid status rejected',is_wp_error(mhc_change_submission($id,'update','invalid')));qa('New → contacted',mhc_change_submission($id,'update','contacted')===true);qa('Contacted → completed',mhc_change_submission($id,'update','completed')===true);
$where=mhc_submission_where(['s'=>$email,'status'=>'completed','type'=>'contact','from'=>wp_date('Y-m-d'),'to'=>wp_date('Y-m-d')]);qa('Combined search/type/status/site-timezone date filters',(int)$wpdb->get_var("SELECT COUNT(*) FROM $table WHERE $where")===1);
$where=mhc_submission_where(['s'=>"' OR 1=1 --"]);qa('SQL injection does not broaden results',(int)$wpdb->get_var("SELECT COUNT(*) FROM $table WHERE $where")===0);
qa('CSV formula and BOM prefix neutralized',mhc_csv_cell('=1+1')==="'=1+1"&&mhc_csv_cell("\xEF\xBB\xBF  @SUM(1)")==="'\xEF\xBB\xBF  @SUM(1)"&&mhc_csv_cell('متن امن')==='متن امن');
qa('Delete requires explicit confirmation',is_wp_error(mhc_change_submission($id,'delete')));
qa('Privacy registration',isset(apply_filters('wp_privacy_personal_data_exporters',[])['mobile-hashtag-core'])&&isset(apply_filters('wp_privacy_personal_data_erasers',[])['mobile-hashtag-core']));
$export=mhc_privacy_export($email);qa('Verified-email export retrieves own records',count($export['data'])===3&&$export['done']);$other=mhc_privacy_export('different@example.test');qa('Other email cannot retrieve records',count($other['data'])===0);
$theme=get_stylesheet();switch_theme('twentytwentyfive');qa('Core form survives theme switch',str_contains(do_shortcode('[mh_contact_form]'),'name="mhc_nonce"'));qa('Stored data survives theme switch',count(mhc_privacy_export($email)['data'])===3);switch_theme($theme);
qa('Confirmed record deletion',mhc_change_submission($id,'delete','',true)===true);$erased=mhc_privacy_erase($email);qa('Privacy eraser removes only requested email',$erased['items_removed']&&$erased['done']&&!$erased['items_retained']&&(int)$wpdb->get_var("SELECT COUNT(*) FROM $table")===$before);
// Actual DB write failure must not return success or call wp_mail.
$breakInsert=function($sql)use($table){return preg_match('/^INSERT INTO/i',$sql)?str_replace($table,$table.'_qa_missing',$sql):$sql;};add_filter('query',$breakInsert);$old=$wpdb->suppress_errors(true);
try{$r=mhc_save_submission($base);qa('Database insert failure returns error, never success',is_wp_error($r)&&$r->get_error_code()==='database',['result'=>is_wp_error($r)?$r->get_error_code():$r]);}finally{remove_filter('query',$breakInsert);$wpdb->suppress_errors($old);}
$wpdb->delete($table,['email'=>$email]);
delete_transient($rate);
$failed=count(array_filter($tests,fn($t)=>!$t['pass']));echo wp_json_encode(['passed'=>count($tests)-$failed,'failed'=>$failed,'tests'=>$tests],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);exit($failed?1:0);
