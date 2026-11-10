<?php
require '/wordpress/wp-load.php';require_once ABSPATH.'wp-admin/includes/plugin.php';wp_set_current_user(1);
switch_theme('mobile-hashtag');
foreach(mhc_page_definitions() as $slug=>$def){mhc_import_page_item($slug,$def);}
update_option('show_on_front','page');update_option('page_on_front',get_page_by_path('home')->ID);update_option('page_for_posts',get_page_by_path('blog')->ID);
update_option('permalink_structure','/%postname%/');flush_rewrite_rules(false);
echo json_encode(['theme'=>get_stylesheet(),'front'=>get_option('page_on_front'),'core'=>is_plugin_active('mobile-hashtag-core/mobile-hashtag-core.php')],JSON_UNESCAPED_UNICODE);
