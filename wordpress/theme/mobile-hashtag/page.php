<?php
/**
 * Page template.
 *
 * Pages imported from the hand-coded source already carry their own markup from
 * frontend/*.html, and that markup is not uniform:
 *   - about-us, privacy, terms  → own `.container.page-space` wrapper, no `.page-heading`
 *   - faq                       → own wrapper AND its own `.page-heading`
 *   - contact-us                → own `.page-heading` only, no wrapper
 * So the wrapper and the heading are decided independently; a page never gets a
 * duplicate of either, and always gets what it is missing.
 *
 * @package Mobile_Hashtag
 */
if (!defined('ABSPATH')) { exit; }
get_header(); ?>
<main id="main">
<?php while (have_posts()) : the_post(); ?>
	<?php
	$mht_content = get_the_content();
	$mht_wrapped = str_contains($mht_content, 'page-space');
	/*
	 * Pages imported from the design source keep that source markup verbatim. They must not go
	 * through wpautop(): it wraps the standalone text link and the contact form in stray <p>
	 * tags, which changes the layout and even nests a block-level <form> inside a paragraph.
	 * The `_mhc_source_markup` flag is set by the importer, so pages the owner writes or edits
	 * still get the normal WordPress pipeline.
	 */
	$mht_source_markup = (bool) get_post_meta(get_the_ID(), '_mhc_source_markup', true);
	// Render the body exactly once. Probing an earlier copy would run shortcodes twice, and
	// shortcodes with one-time effects (the order-tracking token) must not be consumed early.
	ob_start();
	if (is_page(['login', 'register'])) {
		get_template_part('template-parts/auth');
	} elseif ($mht_source_markup) {
		// The plugin's sanitizer keeps the inline SVG arrows of the design; plain
		// wp_kses_post() would strip them, so prefer it when the plugin is active.
		$mht_safe = function_exists('mhc_kses_page') ? mhc_kses_page($mht_content) : wp_kses_post($mht_content);
		echo do_shortcode($mht_safe);
	} else {
		the_content();
		wp_link_pages();
	}
	$mht_body = ob_get_clean();
	// The source titles its pages in more than one shape: a `.page-heading` block, a hero that
	// already opens with its own overline + h1, or a shortcode that renders its own heading.
	$mht_headed = str_contains($mht_body, 'page-heading')
		|| str_contains($mht_body, 'about-hero')
		|| (bool) preg_match('/<h1[\s>]/i', $mht_body);
	?>
	<?php if (!$mht_wrapped) : ?><div class="container page-space"><?php endif; ?>
	<?php if (!$mht_headed) : ?>
		<div class="page-heading">
			<span class="overline">همراه یک انتخاب بهتر</span>
			<h1><?php the_title(); ?></h1>
		</div>
	<?php endif; ?>
	<div class="mht-page-content<?php echo $mht_wrapped ? ' mht-page-nested' : ''; ?>"><?php echo $mht_body; ?></div>
	<?php if (!$mht_wrapped) : ?></div><?php endif; ?>
<?php endwhile; ?>
</main>
<?php get_footer();
