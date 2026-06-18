<?php
/**
 * Life Fragments page template
 * Template Name: Life Fragments
 * @author Haibin
 * @date 2026-06-18
 */

get_header();

$page_content         = get_the_content();
$has_fragments_markup = has_shortcode( $page_content, 'fragments' );
?>

<main class="main-container index fragments-page">
	<div class="main-main">
		<section class="main-content">
			<header class="fragments-header">
				<h1><?php the_title(); ?></h1>
				<?php if ( $page_content && ! $has_fragments_markup ) : ?>
					<div class="fragments-intro">
						<?php the_content(); ?>
					</div>
				<?php endif; ?>
			</header>
			<?php
			if ( $has_fragments_markup ) {
				the_content();
			} else {
				echo do_shortcode( '[fragments]' );
			}
			?>
			<?php get_template_part( './template/index/fixed' ); ?>
		</section>
	</div>
</main>

<?php
get_footer();
