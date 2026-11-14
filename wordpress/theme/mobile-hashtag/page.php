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
	// The source titles its pages in more than one shape: a `.page-heading` block, or a
	// hero/`.prose` section that already opens with its own overline + h1. Any of those
	// means the page has its own heading and must not get the theme's generic one.
	$mht_headed = str_contains($mht_content, 'page-heading')
		|| str_contains($mht_content, 'about-hero')
		|| (bool) preg_match('/<h1[\s>]/i', $mht_content);
	?>
	<?php if (!$mht_wrapped) : ?><div class="container page-space"><?php endif; ?>
	<?php if (!$mht_headed) : ?>
		<div class="page-heading">
			<span class="overline">همراه یک انتخاب بهتر</span>
			<h1><?php the_title(); ?></h1>
		</div>
	<?php endif; ?>
	<div class="mht-page-content<?php echo $mht_wrapped ? ' mht-page-nested' : ''; ?>"><?php
		if (is_page(['login', 'register'])) {
			get_template_part('template-parts/auth');
		} else {
			the_content();
			wp_link_pages();
		}
	?></div>
	<?php if (!$mht_wrapped) : ?></div><?php endif; ?>
<?php endwhile; ?>
</main>
<?php get_footer();
