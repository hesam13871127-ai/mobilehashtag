<?php if(!defined('ABSPATH')){exit;} ?>
<div class="auth-layout"><section class="auth-story"><img src="<?php echo esc_url(mht_asset('images/brand/logo-horizontal.svg')); ?>" alt="موبایل هشتگ" width="240"><span class="overline">به دنیای هشتگ خوش آمدید</span><h1>انتخاب‌های خوب،<br>از اینجا شروع می‌شوند.</h1><p>سفارش‌ها، علاقه‌مندی‌ها و تمام انتخاب‌های شما،<br>در یک جای امن.</p></section><section class="auth-panel">
<?php if(function_exists('WC')){echo do_shortcode('[woocommerce_my_account]');}else{echo '<h2>حساب کاربری فروشگاه</h2><p>بخش فروشگاه هنوز فعال نشده است.</p>';} ?>
</section></div>
