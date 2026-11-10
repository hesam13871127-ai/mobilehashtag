<?php if(!defined('ABSPATH')){exit;} get_header(); ?>
<main id="main">
<div class="container home">
<?php if(get_theme_mod('mht_section_0_visible',true)): ?><section aria-label="پیشنهادهای ویژه" class="hero" data-slides="<?php echo esc_attr(wp_json_encode(mht_slides(),JSON_UNESCAPED_UNICODE)); ?>" style="<?php echo esc_attr(mht_banner_style('hero_0')); ?>">
<div class="hero-content">
<span class="eyebrow"><i></i> انتخاب امروز، تکنولوژی فردا</span>
<h1>یک قدم جلوتر،<br/><span>با دنیای تکنولوژی.</span></h1>
<p>
              جدیدترین گوشی‌های هوشمند، با انتخابی مطمئن.<br/>تجربه‌ای متفاوت از خرید را با هشتگ
              آغاز کنید.
            </p>
<a class="button dark" href="<?php echo esc_url(mht_url('category.html?slug=phones')); ?>" id="hero-link">کشف و خرید گوشی‌ها
              <span><svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></span></a>
<div class="hero-note">
<span class="tiny-stars">✦</span> انتخاب‌های خاص، برای سلیقه‌های خاص
            </div>
</div>
<div class="hero-controls">
<button aria-label="اسلاید قبلی" class="icon-button" id="hero-prev">
<svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M4 12h16m-6-6 6 6-6 6"></path>
</svg>
</button>
<div class="slider-dots" id="hero-dots"></div>
<button aria-label="اسلاید بعدی" class="icon-button" id="hero-next">
<svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path>
</svg></button><button aria-label="توقف اسلایدر" class="icon-button" id="hero-pause">Ⅱ</button>
</div>
<div class="hero-index" id="hero-index">۰۱ <span>/ ۰۴</span></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_1_visible',true)): ?><section aria-label="مزایای خرید" class="benefit-strip">
<div>
<span><?php echo mht_icon('shield'); ?></span>
<p><strong>اصالت، اولین انتخاب ماست</strong><small>انتخاب مطمئن، خیال آسوده</small></p>
</div>
<div>
<span><?php echo mht_icon('truck'); ?></span>
<p>
<strong>ارسال سریع و مطمئن</strong><small>رایگان برای سفارش بالای ۵ میلیون</small>
</p>
</div>
<div>
<span><?php echo mht_icon('refresh'); ?></span>
<p><strong>۷ روز فرصت بررسی</strong><small>شرایط در صفحه قوانین فروشگاه</small></p>
</div>
<div>
<span><?php echo mht_icon('headset'); ?></span>
<p><strong>کنار شما هستیم</strong><small>راهنمایی برای یک انتخاب بهتر</small></p>
</div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_2_visible',true)): ?><section class="section category-section">
<div class="section-heading">
<div>
<span class="overline">دنیای هشتگ</span>
<h2><?php if(get_theme_mod('mht_section_2_title')): echo esc_html(get_theme_mod('mht_section_2_title')); else: ?>دنبال چی می‌گردید؟<?php endif; ?></h2>
</div>
<a class="text-link" href="<?php echo esc_url(mht_url('shop.html')); ?>">همه دسته‌بندی‌ها
              <span><svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></span></a>
</div>
<div class="category-rail" id="home-categories"><?php mht_home_categories(); ?></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_3_visible',true)): ?><section aria-label="پیشنهادهای منتخب" class="promo-grid">
<a class="promo promo-airpods" href="<?php echo esc_url(get_theme_mod('mht_banner_0_link',mht_url('category.html?slug=airpods'))); ?>" style="<?php echo esc_attr(mht_banner_style('banner_0')); ?>"><span>صدای زندگی را بشنو</span>
<h3>کوچک، اما شگفت‌انگیز</h3>
<b>دنیای ایرپادها
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></b></a><a class="promo promo-watch" href="<?php echo esc_url(get_theme_mod('mht_banner_1_link',mht_url('category.html?slug=smartwatches'))); ?>" style="<?php echo esc_attr(mht_banner_style('banner_1')); ?>"><span>همراه هر لحظه تو</span>
<h3>زمان، به سبک شما</h3>
<b>ساعت‌های هوشمند
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></b></a><a class="promo promo-power" href="<?php echo esc_url(get_theme_mod('mht_banner_2_link',mht_url('category.html?slug=powerbanks'))); ?>" style="<?php echo esc_attr(mht_banner_style('banner_2')); ?>"><span>همیشه پرانرژی</span>
<h3>بدون توقف، ادامه بده</h3>
<b>انتخاب پاوربانک
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></b></a>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_4_visible',true)): ?><section class="section" id="popular-section">
<div class="section-heading">
<div>
<span class="overline">محبوب‌ترین انتخاب‌ها</span>
<h2><?php if(get_theme_mod('mht_section_4_title')): echo esc_html(get_theme_mod('mht_section_4_title')); else: ?>گوشی‌های محبوب <span class="gold">هشتگ</span><?php endif; ?></h2>
</div>
<div class="section-links">
<a class="<?php echo sanitize_text_field(wp_unslash($_GET['phone_brand'] ?? '')) === '' ? 'chip active' : 'chip'; ?>" href="<?php echo esc_url(add_query_arg('phone_brand', '', home_url('/')) . '#popular-section'); ?>">همه</a><a class="<?php echo sanitize_text_field(wp_unslash($_GET['phone_brand'] ?? '')) === 'Apple' ? 'chip active' : 'chip'; ?>" href="<?php echo esc_url(add_query_arg('phone_brand', 'Apple', home_url('/')) . '#popular-section'); ?>">اپل</a><a class="<?php echo sanitize_text_field(wp_unslash($_GET['phone_brand'] ?? '')) === 'Samsung' ? 'chip active' : 'chip'; ?>" href="<?php echo esc_url(add_query_arg('phone_brand', 'Samsung', home_url('/')) . '#popular-section'); ?>">سامسونگ</a><a class="<?php echo sanitize_text_field(wp_unslash($_GET['phone_brand'] ?? '')) === 'Xiaomi' ? 'chip active' : 'chip'; ?>" href="<?php echo esc_url(add_query_arg('phone_brand', 'Xiaomi', home_url('/')) . '#popular-section'); ?>">شیائومی</a><a class="text-link" href="<?php echo esc_url(mht_url('category.html?slug=phones')); ?>">مشاهده همه
                <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></a>
</div>
</div>
<div class="product-grid" id="popular-products"><?php mht_home_products('phones',4,'popular'); ?></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_5_visible',true)): ?><section class="offers-section section">
<div class="section-heading">
<div>
<span class="overline">فرصت یک خرید هوشمندانه</span>
<h2><?php if(get_theme_mod('mht_section_5_title')): echo esc_html(get_theme_mod('mht_section_5_title')); else: ?><span><?php echo mht_icon('bolt'); ?></span> پیشنهادهای <span class="gold">طلایی</span><?php endif; ?></h2>
<p>انتخاب‌های دوست‌داشتنی، با قیمت‌های دوست‌داشتنی‌تر</p>
</div>
<a class="button outline" href="<?php echo esc_url(mht_url('shop.html?sale=1')); ?>">همه پیشنهادها
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></a>
</div>
<div class="product-grid" id="sale-products"><?php mht_home_products('accessories',4,'sale'); ?></div>
<small class="demo-prices">قیمت‌ها و تخفیف‌ها نمونه هستند و پیشنهاد فروش واقعی محسوب نمی‌شوند.</small>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_6_visible',true)): ?><section class="wide-campaign" style="<?php echo esc_attr(mht_banner_style('banner_3')); ?>">
<div>
<span class="overline">صدا را دوباره کشف کن</span>
<h2><?php if(get_theme_mod('mht_section_6_title')): echo esc_html(get_theme_mod('mht_section_6_title')); else: ?>فقط تو،<br/>و موسیقی مورد علاقه‌ات.<?php endif; ?></h2>
<p>جزئیات بیشتر. سکوت عمیق‌تر. تجربه‌ای نزدیک‌تر.</p>
<a class="button dark" href="<?php echo esc_url(get_theme_mod('mht_banner_3_link',mht_url('category.html?slug=headphones'))); ?>">دنیای صدا را کشف کن
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></a>
</div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_7_visible',true)): ?><section class="section">
<div class="section-heading">
<div>
<span class="overline">انتخاب همراهان ما</span>
<h2><?php if(get_theme_mod('mht_section_7_title')): echo esc_html(get_theme_mod('mht_section_7_title')); else: ?>پرفروش‌های این روزها<?php endif; ?></h2>
</div>
<div class="carousel-actions">
<button aria-label="محصولات قبلی" class="icon-button" data-direction="1" data-scroll="bestselling-products">
<span><?php echo mht_icon('arrow'); ?></span></button><button aria-label="محصولات بعدی" class="icon-button" data-direction="-1" data-scroll="bestselling-products">
<span><?php echo mht_icon('arrow'); ?></span></button><a class="text-link" href="<?php echo esc_url(mht_url('shop.html?sort=bestselling')); ?>">همه پرفروش‌ها
                <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></a>
</div>
</div>
<div class="product-grid product-carousel" id="bestselling-products"><?php mht_home_products('accessories',8,'bestselling'); ?></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_8_visible',true)): ?><section class="section">
<div class="section-heading">
<div>
<span class="overline">جزئیات، تفاوت می‌سازند</span>
<h2><?php if(get_theme_mod('mht_section_8_title')): echo esc_html(get_theme_mod('mht_section_8_title')); else: ?>همراه‌های کوچک و کاربردی<?php endif; ?></h2>
</div>
<a class="text-link" href="<?php echo esc_url(mht_url('category.html?slug=accessories')); ?>">همه لوازم جانبی
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></a>
</div>
<div class="product-grid" id="accessory-products"><?php mht_home_products('accessories',4,'price'); ?></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_9_visible',true)): ?><section class="double-promo">
<a class="promo promo-case" href="<?php echo esc_url(get_theme_mod('mht_banner_4_link',mht_url('category.html?slug=cases'))); ?>" style="<?php echo esc_attr(mht_banner_style('banner_4')); ?>"><span>یک استایل تازه</span>
<h3>محافظت، با سلیقه شما.</h3>
<b>قاب مورد علاقه‌ات را پیدا کن
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></b></a><a class="promo promo-charger" href="<?php echo esc_url(get_theme_mod('mht_banner_5_link',mht_url('category.html?slug=wall-chargers'))); ?>" style="<?php echo esc_attr(mht_banner_style('banner_5')); ?>"><span>برای روزهای پرمشغله</span>
<h3>سریع‌تر شارژ شو.</h3>
<b>شارژرهای هوشمند
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></b></a>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_10_visible',true)): ?><section class="section">
<div class="section-heading">
<div>
<span class="overline">تازه به هشتگ رسیده</span>
<h2><?php if(get_theme_mod('mht_section_10_title')): echo esc_html(get_theme_mod('mht_section_10_title')); else: ?>تازه‌های دنیای دیجیتال<?php endif; ?></h2>
</div>
<div class="carousel-actions">
<button aria-label="تازه‌های قبلی" class="icon-button" data-direction="1" data-scroll="new-products">
<span><?php echo mht_icon('arrow'); ?></span></button><button aria-label="تازه‌های بعدی" class="icon-button" data-direction="-1" data-scroll="new-products">
<span><?php echo mht_icon('arrow'); ?></span></button><a class="text-link" href="<?php echo esc_url(mht_url('shop.html?sort=newest')); ?>">همه تازه‌ها
                <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></a>
</div>
</div>
<div class="product-grid product-carousel" id="new-products"><?php mht_home_products('',8,'newest'); ?></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_11_visible',true)): ?><section class="section">
<div class="section-heading">
<div>
<span class="overline">زندگی هوشمندتر</span>
<h2><?php if(get_theme_mod('mht_section_11_title')): echo esc_html(get_theme_mod('mht_section_11_title')); else: ?>ساعت‌ها و گجت‌های دوست‌داشتنی<?php endif; ?></h2>
</div>
<a class="text-link" href="<?php echo esc_url(mht_url('category.html?slug=gadgets')); ?>">دنیای گجت‌ها
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></a>
</div>
<div class="product-grid" id="gadget-products"><?php mht_home_products('gadgets',4,'featured'); ?></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_12_visible',true)): ?><section class="speaker-campaign" style="<?php echo esc_attr(mht_banner_style('banner_6')); ?>">
<div>
<span class="overline">حال خوب را با هم بشنویم</span>
<h2><?php if(get_theme_mod('mht_section_12_title')): echo esc_html(get_theme_mod('mht_section_12_title')); else: ?>یک صدا، هزار خاطره.<?php endif; ?></h2>
<p>همراه کوچک دورهمی‌های بزرگ شما.</p>
<a class="button dark" href="<?php echo esc_url(get_theme_mod('mht_banner_6_link',mht_url('category.html?slug=speakers'))); ?>">انتخاب اسپیکر بلوتوثی
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></a>
</div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_13_visible',true)): ?><section class="brands-section">
<span class="overline">از بهترین‌های دنیای تکنولوژی</span>
<h2><?php if(get_theme_mod('mht_section_13_title')): echo esc_html(get_theme_mod('mht_section_13_title')); else: ?>برندهایی که می‌شناسید<?php endif; ?></h2>
<div class="brand-list" id="brand-list"><?php mht_brands(); ?></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_14_visible',true)): ?><section class="section reviews-section">
<div class="section-heading">
<div>
<span class="overline">تجربه همراهی با هشتگ</span>
<h2><?php if(get_theme_mod('mht_section_14_title')): echo esc_html(get_theme_mod('mht_section_14_title')); else: ?>شما، مهم‌ترین بخش داستان ما<?php endif; ?></h2>
</div>
<span class="muted small">دیدگاه‌های تأییدشدهٔ محصولات</span>
</div>
<div class="review-grid"><?php mht_home_reviews(); ?></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_15_visible',true)): ?><section class="section">
<div class="section-heading">
<div>
<span class="overline">قبل از خرید، بیشتر بدانید</span>
<h2><?php if(get_theme_mod('mht_section_15_title')): echo esc_html(get_theme_mod('mht_section_15_title')); else: ?>مجله هشتگ<?php endif; ?></h2>
</div>
<a class="text-link" href="<?php echo esc_url(mht_url('blog.html')); ?>">همه مقاله‌ها
              <svg aria-hidden="true" class="inline-arrow" fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" viewbox="0 0 24 24" width="14">
<path d="M20 12H4m6-6-6 6 6 6"></path></svg></a>
</div>
<div class="blog-grid" id="home-posts"><?php foreach(get_posts(['numberposts'=>3,'post_status'=>'publish']) as $article){mht_post_card($article);} ?></div>
</section><?php endif; ?>
<?php if(get_theme_mod('mht_section_16_visible',true)): ?><section aria-labelledby="home-contact-heading" class="section contact-band" id="home-contact">
<div class="contact-band-intro">
<span class="overline">همراه یک انتخاب بهتر</span>
<h2 id="home-contact-heading"><?php if(get_theme_mod('mht_section_16_title')): echo esc_html(get_theme_mod('mht_section_16_title')); else: ?>با هشتگ در ارتباط باشید<?php endif; ?></h2>
<a class="button dark" href="<?php echo esc_url(mht_url('contact.html')); ?>">تماس و ارسال پیام</a>
</div>
<?php if(function_exists('mhc_contact_block')){echo '<div class="contact-band-details">'.mhc_contact_block().'</div>'; } ?></section><?php endif; ?>
</div>
</main>
<?php get_footer(); ?>
