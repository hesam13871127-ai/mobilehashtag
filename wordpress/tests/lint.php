<?php
$results=[];
foreach(['/wordpress/wp-content/plugins/mobile-hashtag-core','/wordpress/wp-content/themes/mobile-hashtag'] as $base){
    $iterator=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base));
    foreach($iterator as $file){if($file->isFile()&&$file->getExtension()==='php'){
        try{token_get_all(file_get_contents($file->getPathname()),TOKEN_PARSE);$results[]=['file'=>$file->getPathname(),'pass'=>true];}
        catch(Throwable $error){$results[]=['file'=>$file->getPathname(),'pass'=>false,'error'=>$error->getMessage()];}
    }}
}
$failed=count(array_filter($results,fn($r)=>!$r['pass']));echo json_encode(['passed'=>count($results)-$failed,'failed'=>$failed,'results'=>$results],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);exit($failed?1:0);
