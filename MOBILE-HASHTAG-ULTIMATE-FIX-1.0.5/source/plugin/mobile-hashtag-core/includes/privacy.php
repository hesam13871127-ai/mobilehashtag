<?php
if (!defined('ABSPATH')) { exit; }
/** Integrate with verified-email personal-data requests in WordPress Tools. */
add_filter('wp_privacy_personal_data_exporters',function($exporters){
    $exporters['mobile-hashtag-core']=['exporter_friendly_name'=>'پیام‌ها و علاقه‌مندی‌های موبایل هشتگ','callback'=>'mhc_privacy_export'];return $exporters;
});
function mhc_privacy_export($email,$page=1){
    global $wpdb;$page=max(1,(int)$page);$email=sanitize_email($email);
    if(!is_email($email)){return ['data'=>[],'done'=>true];}
    $rows=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$wpdb->prefix}mh_submissions WHERE email=%s ORDER BY id LIMIT 100 OFFSET %d",$email,($page-1)*100),ARRAY_A);
    $data=[];
    foreach($rows as $row){
        $values=[];foreach(['uuid'=>'شناسه','created_at'=>'زمان ثبت (UTC)','name'=>'نام','email'=>'ایمیل','phone'=>'تلفن','message'=>'پیام','type'=>'نوع','status'=>'وضعیت','source_url'=>'صفحهٔ مبدأ','mail_status'=>'وضعیت ارسال اعلان'] as $key=>$label){$values[]=['name'=>$label,'value'=>$row[$key]];}
        $fields=json_decode($row['fields'],true)?:[];$values[]=['name'=>'موضوع','value'=>$fields['subject']??''];
        $data[]=['group_id'=>'mhc-submissions','group_label'=>'پیام‌های موبایل هشتگ','item_id'=>'mhc-'.$row['id'],'data'=>$values];
    }
    if($page===1){$user=get_user_by('email',$email);if($user){$ids=get_user_meta($user->ID,'_mhc_wishlist',true);if(is_array($ids)&&$ids){$data[]=['group_id'=>'mhc-wishlist','group_label'=>'علاقه‌مندی‌های موبایل هشتگ','item_id'=>'mhc-user-'.$user->ID,'data'=>[['name'=>'شناسهٔ محصولات','value'=>implode(', ',array_map('absint',$ids))]]];}}}
    return ['data'=>$data,'done'=>count($rows)<100];
}
add_filter('wp_privacy_personal_data_erasers',function($erasers){
    $erasers['mobile-hashtag-core']=['eraser_friendly_name'=>'پیام‌ها و علاقه‌مندی‌های موبایل هشتگ','callback'=>'mhc_privacy_erase'];return $erasers;
});
function mhc_privacy_erase($email,$page=1){
    global $wpdb;$email=sanitize_email($email);
    if(!is_email($email)){return ['items_removed'=>false,'items_retained'=>false,'messages'=>[],'done'=>true];}
    // Always read the first page: prior batches have already been removed.
    $ids=$wpdb->get_col($wpdb->prepare("SELECT id FROM {$wpdb->prefix}mh_submissions WHERE email=%s ORDER BY id LIMIT 100",$email));
    $removed=false;$failed=false;
    foreach($ids as $id){$result=$wpdb->delete($wpdb->prefix.'mh_submissions',['id'=>(int)$id],['%d']);if($result===false){$failed=true;}elseif($result){$removed=true;}}
    $user=get_user_by('email',$email);if($user&&delete_user_meta($user->ID,'_mhc_wishlist')){$removed=true;}
    return ['items_removed'=>$removed,'items_retained'=>$failed,'messages'=>$failed?['حذف بعضی پیام‌ها ناموفق بود؛ مدیر باید وضعیت پایگاه داده را بررسی کند.']:[],'done'=>$failed||count($ids)<100];
}
add_action('admin_init',function(){
    if(function_exists('wp_add_privacy_policy_content')){wp_add_privacy_policy_content('Mobile Hashtag Core','<p>فرم تماس، درخواست مشاوره و خبرنامه با رضایت کاربر شامل نام، ایمیل، تلفن اختیاری، پیام، صفحهٔ مبدأ و زمان ثبت ذخیره می‌شوند. پیام‌ها تا حذف توسط مدیر نگهداری می‌شوند؛ مالک باید دورهٔ نگهداری مناسب را در سیاست خود تعیین کند. اعلان‌ها به گیرندهٔ تنظیم‌شدهٔ مدیر ارسال می‌شوند. ثبت ارسال به معنی تحویل نیست. علاقه‌مندی حساب در user meta و علاقه‌مندی مهمان با کوکی ضروری HttpOnly و دادهٔ سمت سرور تا ۳۰ روز نگهداری می‌شود. تغییر پوسته این داده‌ها را حذف نمی‌کند. ابزارهای برون‌بری و پاک‌سازی اطلاعات شخصی وردپرس پشتیبانی می‌شوند. دادهٔ سفارش‌ها به‌طور جداگانه تحت کنترل ووکامرس است.</p>');}
});
