<?php

require_once 'vendor/autoload.php';

$api_key = $_REQUEST["api_key"];
$redmine_uri = $_REQUEST["redmine_uri"];
$action = $_REQUEST["action"];

$client = new Redmine\Client($redmine_uri, $api_key );


if ( $action == "getAllProjects" ) {
	echo json_encode( $client->api('project')->all(array('limit' => 999)) );
} else if ( $action == "getTasksByProjectId" ) {
	echo json_encode( $client->api('issue')->all(array('project_id' => $_REQUEST["id"], 'limit' => '9999')));
} else if ( $action == "updateTask" ) {
	$client->api('issue')->update($_REQUEST["id"], array( 'status' => $_REQUEST["status"], 'fixed_version_id' => $_REQUEST["history"] ));
} else if ( $action == "updateTaskDetail" ) {
	$client->api('issue')->update($_REQUEST["id"], array( 'subject' => $_REQUEST["subject"], 'estimated_hours' => $_REQUEST["estimated_hours"], 'assigned_to_id' => $_REQUEST["assigned_to_id"] ));	
} else if ( $action == "getSpentTimeByProjectId" ) {
	echo json_encode( $client->api('time_entry')->all(array('project_id' => $_REQUEST["id"], 'limit' => '999')));
} else if ( $action == "getUsersByProject" ) {
	echo json_encode( $client->api('membership')->all($_REQUEST["id"]));
}  else if ( $action == "getAllHistories" ) {
	echo json_encode( $client->api('version')->all($_REQUEST["project_id"]));
} else if ( $action == "addTask" ) {
	$client->api('issue')->create( array( 'project_id' => $_REQUEST["project_id"], 'subject' => $_REQUEST["name"], 'fixed_version_id' => $_REQUEST["history_id"] ) );
} else if ( $action == "addHistory" ) {
    $client->api('version')->create( $_REQUEST["project_id"], array( 'name' => $_REQUEST["name"] ) );
} else if ( $action == "removeTask" ) {
    $client->api('issue')->remove( $_REQUEST["id"] );
}