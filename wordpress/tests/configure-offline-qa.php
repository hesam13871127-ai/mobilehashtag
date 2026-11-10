<?php
require '/wordpress/wp-load.php';wp_set_current_user(1);
// Runtime QA configuration only, never bundled. This does NOT disable product stock management.
update_option('woocommerce_hold_stock_minutes',0);
echo wp_json_encode(['hold_stock_minutes'=>get_option('woocommerce_hold_stock_minutes'),'manage_stock'=>get_option('woocommerce_manage_stock'),'reason'=>'SQLite adapter cannot execute INSERT SELECT with INTERVAL/FOR UPDATE reservation SQL. Native COD tests proceed without pending-order reservation; concurrency/stock reservation remains unverified.'],JSON_PRETTY_PRINT);
