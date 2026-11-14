<?php
/**
 * Cart page — source-accurate markup (frontend/cart.html + assets/js/pages.js renderCart()).
 *
 * Replaces WooCommerce's table-based cart with the hand-coded store's .cart-layout /
 * .cart-items / .cart-item structure, while every mutation still goes through the
 * official WooCommerce cart form, nonces and wc-cart-update AJAX.
 *
 * @package Mobile_Hashtag
 */
if (!defined('ABSPATH')) { exit; }
defined('ABSPATH') || exit;

$cart_items = WC()->cart->get_cart();
$count      = WC()->cart->get_cart_contents_count();
?>
<div class="mht-cart-wrap">

<?php if (empty($cart_items)) : ?>

	<div class="empty-state">
		<h2>سبد شما منتظر یک انتخاب خوب است.</h2>
		<p>از میان گوشی‌ها و گجت‌های هشتگ، همراه تازه‌تان را پیدا کنید.</p>
		<a class="button dark" href="<?php echo esc_url(wc_get_page_permalink('shop')); ?>">رفتن به فروشگاه</a>
	</div>

<?php else : ?>

	<?php do_action('woocommerce_before_cart'); ?>

	<div class="cart-layout">
		<div>
			<form class="woocommerce-cart-form" action="<?php echo esc_url(wc_get_cart_url()); ?>" method="post">
				<?php do_action('woocommerce_before_cart_table'); ?>
				<?php wp_nonce_field('woocommerce-cart', 'woocommerce-cart-nonce'); ?>

				<div class="cart-items">
					<?php
					foreach ($cart_items as $cart_item_key => $cart_item) :
						$_product   = apply_filters('woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key);
						$product_id = apply_filters('woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key);

						if (!$_product || !$_product->exists() || $cart_item['quantity'] <= 0 || !apply_filters('woocommerce_cart_item_visible', true, $cart_item, $cart_item_key)) {
							continue;
						}

						$product_permalink = apply_filters('woocommerce_cart_item_permalink', $_product->is_visible() ? $_product->get_permalink($cart_item) : '', $cart_item, $cart_item_key);
						$thumbnail         = apply_filters('woocommerce_cart_item_thumbnail', $_product->get_image('woocommerce_thumbnail'), $cart_item, $cart_item_key);
						$item_name         = apply_filters('woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key);
						$line_total        = apply_filters('woocommerce_cart_item_subtotal', WC()->cart->get_product_subtotal($_product, $cart_item['quantity']), $cart_item, $cart_item_key);
						$variation         = wc_get_formatted_cart_item_data($cart_item);
						?>
						<article class="cart-item" data-cart-key="<?php echo esc_attr($cart_item_key); ?>">
							<?php if ($product_permalink) : ?>
								<a href="<?php echo esc_url($product_permalink); ?>"><?php echo wp_kses_post($thumbnail); ?></a>
							<?php else : ?>
								<?php echo wp_kses_post($thumbnail); ?>
							<?php endif; ?>

							<div>
								<h3>
									<?php if ($product_permalink) : ?>
										<a href="<?php echo esc_url($product_permalink); ?>"><?php echo wp_kses_post($item_name); ?></a>
									<?php else : ?>
										<?php echo wp_kses_post($item_name); ?>
									<?php endif; ?>
								</h3>
								<p>
									<?php if ($variation) : ?>
										<?php echo wp_kses_post($variation); ?> ·
									<?php endif; ?>
									<?php echo wp_kses_post(WC()->cart->get_product_price($_product)); ?> / هر عدد
								</p>

								<div class="quantity-control">
									<button type="button" class="qty-step" data-mht-qty="1" aria-label="<?php echo esc_attr(sprintf('افزایش تعداد %s', wp_strip_all_tags($item_name))); ?>">+</button>
									<?php
									$max = $_product->get_max_purchase_quantity();
									echo woocommerce_quantity_input([
										'input_name'   => 'cart[' . $cart_item_key . '][qty]',
										'input_value'  => $cart_item['quantity'],
										'max_value'    => $max > 0 ? $max : '',
										'min_value'    => 1,
										'product_name' => $item_name,
									], $_product, false);
									?>
									<button type="button" class="qty-step" data-mht-qty="-1" aria-label="<?php echo esc_attr(sprintf('کاهش تعداد %s', wp_strip_all_tags($item_name))); ?>">−</button>
								</div>
							</div>

							<div class="cart-item-end">
								<strong><?php echo wp_kses_post($line_total); ?></strong>
								<a class="icon-button mht-remove" href="<?php echo esc_url(WC()->cart->get_remove_url($cart_item_key)); ?>" rel="nofollow" aria-label="<?php echo esc_attr(sprintf('حذف %s', wp_strip_all_tags($item_name))); ?>">
									<span aria-hidden="true">×</span>
								</a>
							</div>
						</article>
					<?php endforeach; ?>
				</div>

				<?php do_action('woocommerce_cart_contents'); ?>

				<input type="hidden" name="update_cart" value="<?php echo esc_attr__('Update cart', 'mobile-hashtag'); ?>" />
				<?php do_action('woocommerce_cart_actions'); ?>
				<?php wp_nonce_field('woocommerce-cart', 'woocommerce-cart-nonce'); ?>

				<div class="cart-actions">
					<a class="text-link section" href="<?php echo esc_url(wc_get_page_permalink('shop')); ?>">ادامه خرید</a>
					<button type="submit" class="button dark" name="update_cart" value="<?php echo esc_attr__('Update cart', 'mobile-hashtag'); ?>">به‌روزرسانی سبد</button>
				</div>
				<?php do_action('woocommerce_after_cart_table'); ?>
			</form>
		</div>

		<div class="cart-collaterals">
			<?php do_action('woocommerce_before_cart_collaterals'); ?>
			<div class="summary-panel">
				<h2>خلاصه سفارش</h2>
				<div class="summary-line">
					<span>قیمت کالاها (<?php echo esc_html(number_format_i18n($count)); ?>)</span>
					<span><?php echo wp_kses_post(WC()->cart->get_cart_subtotal()); ?></span>
				</div>
				<?php do_action('woocommerce_cart_collaterals'); ?>
			</div>
			<?php do_action('woocommerce_after_cart'); ?>
		</div>
	</div>

<?php endif; ?>
</div>
