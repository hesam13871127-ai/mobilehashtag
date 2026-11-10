<?php
if(!defined('ABSPATH')){exit;}
get_header(); ?><main id="main"><div class="container page-space"><?php woocommerce_breadcrumb();while(have_posts()):the_post();wc_get_template_part('content','single-product');endwhile; ?></div></main><?php get_footer(); ?>
