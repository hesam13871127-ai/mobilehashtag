<?php
require '/wordpress/wp-load.php';require_once ABSPATH.'wp-admin/includes/plugin.php';require_once ABSPATH.'wp-admin/includes/file.php';require_once ABSPATH.'wp-admin/includes/misc.php';require_once ABSPATH.'wp-admin/includes/template.php';require_once ABSPATH.'wp-admin/includes/class-wp-upgrader.php';
if(!defined('FS_METHOD'))define('FS_METHOD','direct');wp_set_current_user(1);
if(is_dir(WP_PLUGIN_DIR.'/mobile-hashtag-core')||is_dir(get_theme_root().'/mobile-hashtag'))throw new RuntimeException('Fresh test only; refuses existing installation');
$checks=[];function rc($n,$ok){global $checks;$checks[]=['name'=>$n,'pass'=>(bool)$ok];}
$u=new Plugin_Upgrader(new Automatic_Upgrader_Skin());rc('Install actual Core ZIP',$u->install('/packages/mobile-hashtag-core-plugin.zip')===true);
$u=new Theme_Upgrader(new Automatic_Upgrader_Skin());rc('Install actual theme ZIP',$u->install('/packages/mobile-hashtag-wordpress-theme.zip')===true);
rc('Activate Core',!is_wp_error(activate_plugin('mobile-hashtag-core/mobile-hashtag-core.php')));switch_theme('mobile-hashtag');
rc('Theme 1.0.2',wp_get_theme()->get('Version')==='1.0.2');rc('Core 1.0.2',MHC_VERSION==='1.0.2');rc('No products before dashboard onboarding',(int)wp_count_posts('product')->publish===0);
// NO import/setup calls or manually configured shop/currency/pages here: use the shipped admin workflow.
$f=count(array_filter($checks,fn($c)=>!$c['pass']));echo wp_json_encode(['passed'=>count($checks)-$f,'failed'=>$f,'checks'=>$checks],JSON_PRETTY_PRINT);exit($f?1:0);
