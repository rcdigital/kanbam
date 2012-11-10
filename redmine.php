<?php

require_once 'vendor/autoload.php';

$api_key = $_REQUEST["api_key"];
$redmine_uri = $_REQUEST["redmine_uri"];
$action = $_REQUEST["action"];

$client = new Redmine\Client($redmine_uri, $api_key );


if ( $action == "getAllProjects" ) {
	echo json_encode( $client->api('project')->all() );
} else if ( $action == "getTasksByProjectId" ) {
	echo json_encode( $client->api('issue')->all(array('project_id' => $_REQUEST["id"], 'limit' => 'all')));
} else if ( $action == "updateTask" ) {
	$client->api('issue')->update($_REQUEST["id"], array( 'status' => $_REQUEST["status"], 'category_id' => $_REQUEST["history"] ));	
} else if ( $action == "getSpentTimeByProjectId" ) {
	echo json_encode( $client->api('time_entry')->all(array('project_id' => $_REQUEST["id"], 'limit' => '999')));
} else if ( $action == "getUsersByProject" ) {
	echo json_encode( $client->api('membership')->all($_REQUEST["id"]));
} else if ( $action == "getActivities" ) {
	echo json_encode( $client->api('membership')->all($_REQUEST["id"]));
}