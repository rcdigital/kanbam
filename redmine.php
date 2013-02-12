<?php

require_once 'vendor/autoload.php';

$api_key = $_REQUEST["api_key"];
$redmine_uri = $_REQUEST["redmine_uri"];
$action = $_REQUEST["action"];

$client = new Redmine\Client($redmine_uri, $api_key);


if ( $action == "loadProjects" ) {
	echo json_encode( $client->api('project')->all(array('limit' => 999)) );
} else if ( $action == "loadTasksByProjectId" ) {
	echo json_encode( $client->api('issue')->all(array('project_id' => $_REQUEST["id"], 'limit' => '9999')));
} else if ( $action == "changeStatusTask" ) {
	$client->api('issue')->update($_REQUEST["id"], array( 'status' => $_REQUEST["status"], 'fixed_version_id' => $_REQUEST["story"] ));
} else if ( $action == "updateTask" ) {
	$client->api('issue')->update($_REQUEST["id"], array( 'subject' => $_REQUEST["subject"], 'estimated_hours' => $_REQUEST["estimated_hours"], 'assigned_to_id' => $_REQUEST["assigned_to_id"] ));	
} else if ( $action == "loadSpentTimesByProjectId" ) {
	echo json_encode( $client->api('time_entry')->all(array('project_id' => $_REQUEST["project_id"], 'limit' => '999')));
} else if ( $action == "loadUsersByProjectId" ) {
	echo json_encode( $client->api('membership')->all($_REQUEST["project_id"]));
}  else if ( $action == "loadStories" ) {
	echo json_encode( $client->api('version')->all($_REQUEST["project_id"]));
}  else if ( $action == "loadActivities" ) {
	echo json_encode( $client->api('tracker')->all());
} else if ( $action == "addTask" ) {
	$client->api('issue')->create( array( 'project_id' => $_REQUEST["project_id"], 'subject' => $_REQUEST["name"], 'fixed_version_id' => $_REQUEST["story_id"], 'tracker_id' => $_REQUEST["activity_id"], 'estimated_hours' => $_REQUEST["hours"]  ) );
} else if ( $action == "addStory" ) {
    $client->api('version')->create( $_REQUEST["project_id"], array( 'name' => $_REQUEST["name"], 'due_date' => $_REQUEST["date"] ) );
} else if ( $action == "removeTask" ) {
    $client->api('issue')->remove( $_REQUEST["id"] );
} else if ( $action == "removeSpentTime" ) {
    $client->api('time_entry')->remove( $_REQUEST["id"] );
} else if ( $action == "loadSpentTimeActivities" ) {
    echo json_encode( $client->api('time_entry_activity')->all() );
} else if ( $action == "addSpentTime" ) {
    $client->api('time_entry')->create(array( 'issue_id' => $_REQUEST["issue_id"], 'hours' => $_REQUEST["hours"], 'activity_id' => $_REQUEST["activity_id"] ));
}