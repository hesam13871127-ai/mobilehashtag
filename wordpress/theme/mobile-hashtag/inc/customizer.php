<?php
if (!defined('ABSPATH')) { exit; }
function mht_banner_style($key) {
    $id=absint(get_theme_mod('mht_'.$key.'_image',0));$url=$id?wp_get_attachment_image_url($id,'full'):'';
    return $url ? 'background-image:url("'.esc_url_raw($url).'")' : '';
}
function mht_slides() {
    $defaults=[
        ['class'=>'','eyebrow'=>'انتخاب امروز، تکنولوژی فردا','title'=>'یک قدم جلوتر،<br><span>با دنیای تکنولوژی.</span>','body'=>'جدیدترین گوشی‌های هوشمند، با انتخابی مطمئن.<br>تجربه‌ای متفاوت از خرید را با هشتگ آغاز کنید.','link'=>'category.html?slug=phones','cta'=>'کشف و خرید گوشی‌ها'],
        ['class'=>'audio','eyebrow'=>'جزئیات را دوباره بشنو','title'=>'دنیای بیرون، خاموش.<br><span>موسیقی تو، روشن.</span>','body'=>'صدای شفاف، طراحی چشم‌نواز و آرامشی که با توست.<br>همراه تازه موسیقی‌ات را پیدا کن.','link'=>'category.html?slug=headphones','cta'=>'دنیای هدفون‌ها'],
        ['class'=>'watch','eyebrow'=>'هر لحظه، هوشمندانه‌تر','title'=>'زمان به سبک تو،<br><span>زندگی در حرکت.</span>','body'=>'همراهی سبک برای روزهای پرانرژی.<br>ساعت‌های هوشمند را نزدیک‌تر ببین.','link'=>'category.html?slug=smartwatches','cta'=>'انتخاب ساعت هوشمند'],
        ['class'=>'power','eyebrow'=>'برای تمام مسیرهای پیش رو','title'=>'همیشه متصل،<br><span>همیشه پرانرژی.</span>','body'=>'برای لحظه‌هایی که نمی‌خواهی متوقف شوی.<br>یک همراه مطمئن برای شارژ روزهای تو.','link'=>'category.html?slug=powerbanks','cta'=>'دیدن پاوربانک‌ها'],
    ];
    foreach($defaults as $i=>&$slide){
        foreach(['eyebrow','title','body','cta'] as $field){$custom=get_theme_mod('mht_hero_'.$i.'_'.$field,'');if($custom!==''){$slide[$field]=wp_kses($custom,['br'=>[],'span'=>[]]);}}
        $slide['link']=get_theme_mod('mht_hero_'.$i.'_link',mht_url($slide['link']));
        $id=absint(get_theme_mod('mht_hero_'.$i.'_image',0));$slide['image']=$id?wp_get_attachment_image_url($id,'full'):'';
    }
    return $defaults;
}
add_action('customize_register',function($wp_customize){
    $wp_customize->add_panel('mht_store',['title'=>'طراحی موبایل هشتگ','priority'=>30]);
    $wp_customize->add_section('mht_general',['title'=>'رنگ، اعلان و پابرگ','panel'=>'mht_store']);
    $wp_customize->add_setting('mht_gold',['default'=>'#c9a44c','sanitize_callback'=>'sanitize_hex_color']);
    $wp_customize->add_control(new WP_Customize_Color_Control($wp_customize,'mht_gold',['label'=>'رنگ طلایی برند','section'=>'mht_general']));
    foreach(['announcement'=>'اعلان بالای سایت','notice'=>'متن وضعیت فروشگاه','footer_description'=>'توضیح پابرگ','copyright'=>'حقوق پابرگ'] as $key=>$label){
        $defaults=['announcement'=>'ارسال رایگان سفارش‌های بالای ۵ میلیون تومان','notice'=>'کاتالوگ نمونه — قیمت‌ها نیازمند تأیید','footer_description'=>'همراه شما در دنیای تکنولوژی؛ مجموعه‌ای از گوشی‌های هوشمند و لوازم جانبی برای انتخابی آگاهانه و تجربه‌ای متفاوت.','copyright'=>'© موبایل هشتگ. تمامی حقوق طراحی محفوظ است.'];
        $wp_customize->add_setting('mht_'.$key,['default'=>$defaults[$key],'sanitize_callback'=>'sanitize_text_field']);
        $wp_customize->add_control('mht_'.$key,['label'=>$label,'section'=>'mht_general','type'=>'textarea']);
    }
    $config=json_decode(file_get_contents(get_template_directory().'/inc/home-sections.json'),true);
    $wp_customize->add_section('mht_sections',['title'=>'نمایش و عنوان بخش‌های خانه','panel'=>'mht_store']);
    foreach($config['sections'] as $key=>$label){
        $wp_customize->add_setting('mht_'.$key.'_visible',['default'=>true,'sanitize_callback'=>function($v){return(bool)$v;}]);
        $wp_customize->add_control('mht_'.$key.'_visible',['label'=>'نمایش: '.$label,'type'=>'checkbox','section'=>'mht_sections']);
        if(!in_array($key,['section_0','section_1','section_3','section_9'],true)){
            $wp_customize->add_setting('mht_'.$key.'_title',['sanitize_callback'=>'sanitize_text_field']);
            $wp_customize->add_control('mht_'.$key.'_title',['label'=>'عنوان جایگزین: '.$label,'section'=>'mht_sections']);
        }
    }
    foreach(array_merge(array_combine(['hero_0','hero_1','hero_2','hero_3'],['اسلاید گوشی','اسلاید هدفون','اسلاید ساعت','اسلاید پاوربانک']),$config['banners']) as $key=>$label){
        $section='mht_'.$key;$wp_customize->add_section($section,['title'=>$label,'panel'=>'mht_store']);
        $wp_customize->add_setting('mht_'.$key.'_image',['sanitize_callback'=>'absint']);
        $wp_customize->add_control(new WP_Customize_Media_Control($wp_customize,'mht_'.$key.'_image',['label'=>'تصویر جایگزین بنر (خالی: اصل طراحی)','section'=>$section,'mime_type'=>'image']));
        $wp_customize->add_setting('mht_'.$key.'_link',['sanitize_callback'=>'esc_url_raw']);
        $wp_customize->add_control('mht_'.$key.'_link',['label'=>'پیوند مقصد','section'=>$section,'type'=>'url']);
        if(str_starts_with($key,'hero')){foreach(['eyebrow'=>'روتیتر','title'=>'عنوان (br و span مجاز)','body'=>'توضیح','cta'=>'متن دکمه'] as $field=>$text){
            $wp_customize->add_setting('mht_'.$key.'_'.$field,['sanitize_callback'=>function($v){return wp_kses($v,['br'=>[],'span'=>[]]);}]);
            $wp_customize->add_control('mht_'.$key.'_'.$field,['label'=>$text,'section'=>$section,'type'=>'textarea']);
        }}
    }
});
