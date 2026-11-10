<?php
if (!defined('ABSPATH')) { exit; }
get_header(); ?>
<main id="main"><div class="container page-space">
<?php woocommerce_breadcrumb(); ?><div class="page-heading"><span class="overline">انتخابی آگاهانه، تجربه‌ای متفاوت</span><h1><?php woocommerce_page_title(); ?></h1><p>محصول مورد علاقه‌تان را پیدا کنید؛ جزئیات را به ما بسپارید.</p></div>
<?php do_action('woocommerce_archive_description'); ?>
<div class="shop-layout"><aside class="filter-panel" id="shop-filters"><?php get_template_part('template-parts/shop-filters'); ?></aside>
<section class="listing"><button class="button outline mobile-filter" id="filter-toggle" aria-expanded="false" aria-controls="shop-filters">فیلتر محصولات</button>
<?php if(woocommerce_product_loop()): ?><div class="shop-toolbar"><?php do_action('woocommerce_before_shop_loop'); ?></div>
<div class="product-grid three"><?php while(have_posts()):the_post();do_action('woocommerce_shop_loop');mht_product_card();endwhile; ?></div>
<?php do_action('woocommerce_after_shop_loop');else:do_action('woocommerce_no_products_found');endif; ?></section></div></div></main>
<?php get_footer(); ?>
