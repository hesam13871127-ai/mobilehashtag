<?php if(!defined('ABSPATH')){exit;} get_header(); ?><main id="main"><?php while(have_posts()):the_post(); ?>
<?php // Imported pages already ship the source's own .page-space wrapper and heading; only pages that have none get the generic heading. ?>
<?php $mht_nested = str_contains(get_the_content(), 'page-space'); ?>
<?php if (!$mht_nested) : ?><div class="container page-space"><div class="page-heading"><span class="overline">همراه یک انتخاب بهتر</span><h1><?php the_title(); ?></h1></div><?php endif; ?>
<div class="mht-page-content<?php echo $mht_nested ? ' mht-page-nested' : ''; ?>"><?php if(is_page(['login','register'])){get_template_part('template-parts/auth');}else{the_content();wp_link_pages();} ?></div><?php if (!$mht_nested) : ?></div><?php endif; ?><?php endwhile; ?></main><?php get_footer(); ?>
