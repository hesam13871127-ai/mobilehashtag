<?php
require '/wordpress/wp-load.php';wp_set_current_user(1);
// Explicit isolated-test setup matching INSTALL-FA: never run this against a customer's site.
foreach(['cart'=>['سبد خرید','[woocommerce_cart]'],'checkout'=>['تکمیل سفارش','[woocommerce_checkout]'],'account'=>['حساب کاربری','[woocommerce_my_account]']] as $slug=>$data){$page=get_page_by_path($slug);wp_update_post(['ID'=>$page->ID,'post_title'=>$data[0],'post_content'=>$data[1]]);update_option('woocommerce_'.($slug==='account'?'myaccount':$slug).'_page_id',$page->ID);}
echo 'Configured classic official WC shortcode pages in isolated test database. Existing customer pages are never overwritten by the packaged importer.';
