<?php
	$api_key = $_REQUEST["api_key"];
	$redmine_uri = $_REQUEST["redmine_uri"];
	$format = $_REQUEST["format"];
	$action = $_REQUEST["action"];
	$params = $_REQUEST["params"];
	
	$cmd = 'curl -k -v -H "Content-Type: application/' . $format . '" -H "X-Redmine-API-Key: ' . $api_key . '" ' . $redmine_uri . $action . '.' . $format . "?" . $params;
    exec($cmd, $retorno);
    
    print_r( $retorno[0] );
    
    
?>