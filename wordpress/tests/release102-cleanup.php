<?php
// QA-only: remove ONLY the known generated hidden variation fixture and its reviews.
require '/wordpress/wp-load.php';wp_set_current_user(1);
if(wp_get_environment_type()!=='local'){throw new RuntimeException('Local QA only');}
$id=(int)get_option('mhc_final_variable');$p=$id?wc_get_product($id):false;$removed=false;
if($p && $p->get_slug()==='mh-qa-variable' && !$p->get_meta('_mhc_source_id')){$p->delete(true);delete_option('mhc_final_variable');$removed=true;}
$products=get_posts(['post_type'=>'product','post_status'=>'publish','numberposts'=>-1,'fields'=>'ids','meta_key'=>'_mhc_source_id']);
echo wp_json_encode(['removed_only_hidden_test_fixture'=>$removed,'published_reference_products'=>count($products),'catalog_retained'=>count($products)===28,'note'=>'QA orders and submitted form evidence remain only in the isolated test DB. No DB is shipped.'],JSON_PRETTY_PRINT);exit(count($products)===28?0:1);
