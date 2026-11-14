<?php
/**
 * Checkout page — source-accurate two-column layout (frontend/checkout.html + pages.js checkout()).
 *
 * Keeps the official WooCommerce checkout form, nonces, AJAX and payment box; only the
 * surrounding markup is rebuilt to match the hand-coded store.
 *
 * @package Mobile_Hashtag
 */
if (!defined('ABSPATH')) { exit; }

do_action('woocommerce_before_checkout_form', $checkout);

// If checkout registration is disabled and not logged in, the user cannot checkout.
if (!$checkout->is_registration_enabled() && $checkout->is_registration_required() && !is_user_logged_in()) {
	echo esc_html(apply_filters('woocommerce_checkout_must_be_logged_in_message', __('You must be logged in to checkout.', 'woocommerce')));
	return;
}
?>
<div class="mht-checkout-wrap">
<form name="checkout" method="post" class="checkout woocommerce-checkout checkout-layout" action="<?php echo esc_url(wc_get_checkout_url()); ?>" enctype="multipart/form-data" aria-label="<?php echo esc_attr__('Checkout', 'woocommerce'); ?>">

	<div class="panel">
		<h2>۱. مشخصات و نشانی تحویل</h2>

		<?php if ($checkout->get_checkout_fields()) : ?>
			<?php do_action('woocommerce_checkout_before_customer_details'); ?>
			<div class="form-stack" id="customer_details">
				<?php do_action('woocommerce_checkout_billing'); ?>
				<?php do_action('woocommerce_checkout_shipping'); ?>
			</div>
			<?php do_action('woocommerce_checkout_after_customer_details'); ?>
		<?php endif; ?>

		<hr>
		<h2>۲. روش پرداخت</h2>
		<div class="payment-option">
			<?php if (WC()->cart->needs_payment()) : ?>
				<h3>ثبت سفارش</h3>
				<p>سفارش شما در فروشگاه ثبت می‌شود. اگر درگاه بانکی فعال نباشد، سفارش با روش پرداخت رسمی ووکامرس ثبت شده و مبلغی از حساب شما کسر نمی‌شود.</p>
			<?php else : ?>
				<h3>بدون نیاز به پرداخت</h3>
				<p>مبلغ سفارش شما صفر است؛ سفارش مستقیماً ثبت می‌شود.</p>
			<?php endif; ?>
		</div>

		<?php do_action('woocommerce_checkout_before_order_review_heading'); ?>
		<h2 id="order_review_heading">۳. بازبینی سفارش</h2>
		<?php do_action('woocommerce_checkout_before_order_review'); ?>
		<div id="order_review" class="woocommerce-checkout-review-order">
			<?php do_action('woocommerce_checkout_order_review'); ?>
		</div>
		<?php do_action('woocommerce_checkout_after_order_review'); ?>
	</div>

	<div class="checkout-aside">
		<div class="summary-panel">
			<h2>خلاصه سفارش</h2>
			<div class="summary-line">
				<span>قیمت کالاها (<?php echo esc_html(number_format_i18n(WC()->cart->get_cart_contents_count())); ?>)</span>
				<span><?php echo wp_kses_post(WC()->cart->get_cart_subtotal()); ?></span>
			</div>
			<div class="summary-line">
				<span>هزینه ارسال</span>
				<span><?php echo wp_kses_post(WC()->cart->get_cart_shipping_total() ? WC()->cart->get_cart_shipping_total() : 'رایگان'); ?></span>
			</div>
			<div class="summary-line total">
				<span>مبلغ نهایی</span>
				<span><?php echo wp_kses_post(WC()->cart->get_total()); ?></span>
			</div>
			<p>پرداخت امن؛ اطلاعات کارت بانکی هرگز در فروشگاه ذخیره نمی‌شود.</p>
		</div>
		<div class="panel section">
			<h3>انتخاب‌های شما</h3>
			<?php foreach (WC()->cart->get_cart() as $cart_item) : ?>
				<?php $_product = $cart_item['data']; if (!$_product || !$_product->exists()) { continue; } ?>
				<div class="checkout-summary-item">
					<span><?php echo wp_kses_post($_product->get_name()); ?> <b>× <?php echo esc_html(number_format_i18n($cart_item['quantity'])); ?></b></span>
					<span><?php echo wp_kses_post(WC()->cart->get_product_subtotal($_product, $cart_item['quantity'])); ?></span>
				</div>
			<?php endforeach; ?>
		</div>
		<a class="text-link section" href="<?php echo esc_url(wc_get_cart_url()); ?>">بازگشت به سبد خرید</a>
	</div>
</form>
</div>
<?php do_action('woocommerce_after_checkout_form', $checkout); ?>
