define(['jquery', 'exports', 'underscore'], function($, exports, underscore){
    
    exports.init = function($scope, kanbam) {
        $scope.tool = new Redmine($scope, kanbam);
        $scope.tool.start();
    }
    
    var Redmine = function($scope, kanbam) {
        this.$scope = $scope;
        this.proxyURI = "";
        this.kanbam = kanbam;
        this.listOfSpentTimesUsed = [];
        this.reloadCount = 0;
    }
    
    Redmine.prototype.start = function() {
        this.proxyURI = this.$scope.settings.appURI + 
            "redmine.php?api_key=" + this.$scope.settings.apiKey + 
            "&redmine_uri=" + this.$scope.settings.redmineURI;
        
        this.reloadCount++;
        
        this.loadActivities();
        this.loadSpentTimeActivities();
    }
    
    Redmine.prototype.loadActivities = function() {
        this.loadAPI({
            action : "loadActivities"
        }, this.onLoadActivities );
    }
    
    Redmine.prototype.onLoadActivities = function(data) {
        this.$scope.activities = [];
        
        for (var t in data.trackers) {
            this.$scope.activities.push({ 
                name : data.trackers[t].name, 
                id : data.trackers[t].id
            });
        }
        
        this.loadProjects();
    }
    
    Redmine.prototype.loadSpentTimeActivities = function() {
        this.loadAPI({
            action : "loadSpentTimeActivities"
        }, this.onLoadSpentTimeActivities );
    }
    
    Redmine.prototype.onLoadSpentTimeActivities = function(data) {
        this.$scope.spentTimeActivities = [];
        
        for (var t in data.time_entry_activities) {
            this.$scope.spentTimeActivities.push({ 
                name : data.time_entry_activities[t].name, 
                id : data.time_entry_activities[t].id
            });
        }
    }
    
    Redmine.prototype.loadProjects = function() {
        this.loadAPI({
            action : "loadProjects"
        }, this.onLoadProjects );
    }
    
    Redmine.prototype.onLoadProjects = function(data) {
        var lastProject = { id : -1, name : "" };
        
        this.$scope.projects = [];
        
        for (var p in data.projects) {
            this.$scope.projects.push({
                id : data.projects[p].id,
                name : data.projects[p].name,
                parent : (data.projects[p].parent != undefined) ? data.projects[p].parent.name : ""
            });
            
            if (data.projects[p].id > lastProject.id) {
                lastProject = { id : data.projects[p].id, name : data.projects[p].name }
            }    
        }
        
        if (this.$scope.currentProject.id == null) {
            this.$scope.currentProject = lastProject;
        }
        
        this.loadTasksByProjectId(this.$scope.currentProject.id);
        this.loadUsersByProjectId(this.$scope.currentProject.id);
        
        this.kanbam.onUpdateData();
        this.kanbam.projectsEvents();
    }
        
    Redmine.prototype.loadUsersByProjectId = function(id) {
        this.loadAPI({
            action : "loadUsersByProjectId",
            project_id : id
        }, this.onLoadUsersByProjectId);
    }
    
    Redmine.prototype.onLoadUsersByProjectId = function(data) {
        if ( data != null ) {
            this.$scope.currentProject.memberships = [];
            
            for ( m in data.memberships ) {
                this.$scope.currentProject.memberships.push( data.memberships[ m ].user );
            }
            
            this.kanbam.onUpdateData();
        } else {
            this.kanbam.showError("No members registered for this project.");
        }
    }
    
    Redmine.prototype.getProjectById = function(id) {
        for (var i = 0; i < this.$scope.projects.length; i++) {
            if (this.$scope.projects[i].id == id) {
                return this.$scope.projects[i];
            }
        }
    }
    
    Redmine.prototype.changeProject = function(id) {
        this.$scope.stories = [];
        this.$scope.currentProject = this.getProjectById(id);
        this.$scope.currentProject.memberships = undefined;
        
                
        $.cookie("lastProjectId", id);
        $.cookie("lastProjectName", this.getProjectById(id).name);
        
        this.kanbam.onUpdateData();
        
        this.start();
    }
    
    Redmine.prototype.loadTasksByProjectId = function(id) {
        this.loadAPI({
            action : "loadTasksByProjectId",
            id : id
        }, this.onLoadTasksByProjectId);
    }
    
    Redmine.prototype.onLoadTasksByProjectId = function(data) {
        this.$scope.tasks = [];
        
        if ( data.issues.length != 0 ) {
            if (this.reloadCount == 1) {
                for ( var i in data.issues ) {
                    this.$scope.tasks.push({
                        id : data.issues[i].id,
                        name : data.issues[i].subject,
                        story_id : this.getTaskVersion(data.issues[i]).id,
                        story_name : this.getTaskVersion(data.issues[i]).name,
                        estimated : ( data.issues[i].estimated_hours == undefined) ? 0 : Number(data.issues[i].estimated_hours),
                        assigned_to_id : (data.issues[i].assigned_to == undefined) ? "" : data.issues[i].assigned_to.id,
                        assigned_to_name : (data.issues[i].assigned_to == undefined) ? "" : data.issues[i].assigned_to.name,
                        status_id : this.getTaskStatus(data.issues[i]).id,
                        status_name : this.getTaskStatus(data.issues[i]).name,
                        type : data.issues[i].tracker.id,
                        project_id : this.$scope.currentProject.id,
                        spent_time_list : []
                    });
                }
                
                this.$scope.tasks = _.sortBy(this.$scope.tasks, function(task){ return task.id; });
            }
            
        } else {
            this.kanbam.showError("No task registered for this project.");
        }
        
        this.reloadCount--;
        
        this.loadStories(this.$scope.currentProject.id);
    }
    
    Redmine.prototype.loadStories = function(project_id) {
        this.loadAPI({
            action : "loadStories",
            project_id : project_id
        }, this.onLoadStories);
    }
    
    Redmine.prototype.onLoadStories = function(data) {
        this.$scope.stories = [];
        this.allStories = [];

        if ( data != null ) {
            for (var v in data.versions) {
                this.allStories.push({ 
                    id : data.versions[v].id,
                    name : data.versions[v].name,
                    date : ( data.versions[v].due_date == undefined ) ? "" : data.versions[v].due_date
                });
            }
            
            this.loadSpentTimesByProjectId(this.$scope.currentProject.id);
            this.formatTasksByStory();
        } else {
            this.kanbam.showError("No stories (versions) registered for this project.");
        }
    }
    
    Redmine.prototype.loadSpentTimesByProjectId = function(id) {
        this.loadAPI({
            action : "loadSpentTimesByProjectId",
            project_id : id
        }, this.onLoadSpentTimesByProjectId );
    }
    
    Redmine.prototype.onLoadSpentTimesByProjectId = function(data) {
        this.$scope.currentProject.totalSpent = 0;
        this.$scope.currentProject.totalEstimatedAndSpent = 0;
        this.listOfSpentTimesUsed = [];
        
        data.time_entries = _.sortBy(data.time_entries, function(time_entry){ return (time_entry.id * -1); });
        
        for ( var i = 0; i < this.$scope.tasks.length; i++ ) {
            this.$scope.tasks[i].spent_time = 0;
            this.$scope.tasks[i].spent_time_list = [];
        }
        
        for ( t in data.time_entries ) {
            this.$scope.currentProject.totalSpent += data.time_entries[t].hours;
            for ( var i = 0; i < this.$scope.tasks.length; i++ ) {
                if ( data.time_entries[t].issue != undefined ) {
                    if ( data.time_entries[t].issue.id == this.$scope.tasks[i].id ) {
                        if ( !this.isSpentTimeIdUsed( data.time_entries[t].issue.id  ) ) { 
                            this.$scope.currentProject.totalEstimatedAndSpent += this.$scope.tasks[i].estimated;
                        }
                        
                        if ( this.$scope.tasks[i].spent_time == undefined ) {
                            this.$scope.tasks[i].spent_time = 0;
                        }
                        
                        this.$scope.tasks[i].spent_time_list.push({
                            id : data.time_entries[t].id,
                            activity_id : data.time_entries[t].activity.id,
                            activity_name : data.time_entries[t].activity.name,
                            hours : data.time_entries[t].hours
                        });
    
                        this.$scope.tasks[i].spent_time += data.time_entries[t].hours;
                        
                        break;
                    }
                }
            }
        }
        
        this.$scope.currentProject.totalSpent = Math.round( this.$scope.currentProject.totalSpent );
        
        this.updateEstimatedBar();
        this.kanbam.onUpdateData();
        this.kanbam.spentTimeEvents();
        this.updateEstimatedBar();
    }
    
    Redmine.prototype.formatTasksByStory = function() {
        stories = _.groupBy(this.$scope.tasks, function(task) { return task.story_name; } );
        
        this.$scope.stories = [];
        
        for (h in stories) {
            this.$scope.stories.push({ 
                id: stories[h][0].story_id,
                name: h, 
                todo: _.filter(stories[h], function(task) { return ( task.status_name == "TODO" ) == 1; }),
                doing: _.filter(stories[h], function(task) { return ( task.status_name == "DOING" ) == 1; }), 
                done: _.filter(stories[h], function(task) { return ( task.status_name == "DONE" ) == 1; }),
                total_estimated: _.reduce(stories[h], function(memo, task){ return (task.estimated == undefined) ? memo : memo + task.estimated; }, 0),
                date : this.getDateByStoryId( stories[h][0].story_id )
            });
        }
        
        this.$scope.stories = _.uniq(_.union( this.$scope.stories, this.allStories ), false, function(story){ return story.id; });
        this.$scope.stories = _.sortBy(this.$scope.stories, function(story){ return story.name; }); 
    
        this.updateEstimatedBar();
        
        this.kanbam.onUpdateData();
        this.kanbam.renderTasks();
    }
    
    Redmine.prototype.updateEstimatedBar = function() {
        var totalEstimated = {
            todo : _.reduce(this.$scope.tasks, function(memo, task){ return (task.estimated != undefined && task.status_name == "TODO") ? memo + task.estimated : memo; }, 0), 
            doing : _.reduce(this.$scope.tasks, function(memo, task){ return (task.estimated != undefined && task.status_name == "DOING") ? memo + task.estimated : memo; }, 0), 
            done : _.reduce(this.$scope.tasks, function(memo, task){ return (task.estimated != undefined && task.status_name == "DONE") ? memo + task.estimated : memo; }, 0)
        };
        
        this.$scope.totalTasks = _.reduce(totalEstimated, function(memo, num){ return memo + num; }, 0);
        
        this.$scope.currentProject.totalTodo = parseInt( ( totalEstimated.todo / this.$scope.totalTasks ) * 100 );
        this.$scope.currentProject.totalDoing = parseInt( (totalEstimated.doing / this.$scope.totalTasks ) * 100 );
        this.$scope.currentProject.totalDone = 100 - this.$scope.currentProject.totalTodo - this.$scope.currentProject.totalDoing;
        
        this.$scope.currentProject.totalEstimated = Math.round(this.$scope.totalTasks);
        
        this.$scope.currentProject.variation = ( 100 - Math.round( ( this.$scope.currentProject.totalEstimatedAndSpent * 100 ) / this.$scope.currentProject.totalSpent ) );
    }
    
    Redmine.prototype.changeStatusTask = function(task) {
        this.loadAPI({
            action : "changeStatusTask",
            id : task.id,
            story : task.story,
            status : task.status
        });
        
        for (i = 0; i < this.$scope.tasks.length; i++) {
            if (this.$scope.tasks[ i ].id == task.id) {
                this.$scope.tasks[ i ].status_name = task.status;
                this.$scope.tasks[ i ].story_id = Number(task.story);
                this.$scope.tasks[ i ].story_name = this.getStoryById(task.story).name;
                break;
            }
        }
        
        this.formatTasksByStory();
        this.kanbam.onUpdateData();
    }
    
    Redmine.prototype.removeTask = function(id) {
        this.loadAPI({
            action : "removeTask",
            id : id
        });
        
        this.$scope.tasks = _.reject(this.$scope.tasks, function(task){ return task.id == id; });
        
        this.formatTasksByStory();
        this.kanbam.onUpdateData();
    }
    
    Redmine.prototype.addSpentTime = function(spentTime) {
        this.loadAPI({
            action : "addSpentTime",
            issue_id : spentTime.issueId,
            hours : spentTime.hours,
            activity_id : spentTime.activityId
        }, this.onAddSpentTime);
        
        for (i = 0; i < this.$scope.tasks.length; i++) {
            if ( this.$scope.tasks[ i ].id == spentTime.issueId ) {
                this.$scope.tasks[ i ].spent_time = Number(this.$scope.tasks[ i ].spent_time) + Number(spentTime.hours);
                this.$scope.tasks[ i ].spent_time_list.push({
                    id : 99999999,
                    activity_id : spentTime.activityId,
                    activity_name : spentTime.activityName,
                    hours : spentTime.hours        
                });
                
                this.$scope.tasks[ i ].spent_time_list = _.sortBy(this.$scope.tasks[ i ].spent_time_list, function(spent_time){ return (spent_time.id * -1); });
            }
        }
        
        this.formatTasksByStory();
        this.kanbam.onUpdateData();
    }
    
    Redmine.prototype.onAddSpentTime = function() {
        this.refreshSpentTime();
    }
    
    Redmine.prototype.removeSpentTime = function(id) {
        this.loadAPI({
            action : "removeSpentTime",
            id : id
        }, this.onRemoveSpentTime);
        
        for (i = 0; i < this.$scope.tasks.length; i++) {
            for (j = 0; j < this.$scope.tasks[ i ].spent_time_list.length; j++) {
                if ( this.$scope.tasks[ i ].spent_time_list[ j ].id == id ) {
                    this.$scope.tasks[ i ].spent_time -= this.$scope.tasks[ i ].spent_time_list[ j ].hours;
                    this.$scope.tasks[ i ].spent_time_list = _.reject(this.$scope.tasks[ i ].spent_time_list, function(spent_time){ return spent_time.id == id; });
                }
            }
        }
        
        this.$scope.editTask.spent_time_list = _.reject(this.$scope.editTask.spent_time_list, function(spent_time){ return spent_time.id == id; });
        
        this.kanbam.onUpdateData();
    }
    
    Redmine.prototype.onRemoveSpentTime = function() {
        this.refreshSpentTime();
    }
    
    Redmine.prototype.refreshSpentTime = function() {
        this.loadSpentTimesByProjectId(this.$scope.currentProject.id);
        
        this.formatTasksByStory();
        this.kanbam.onUpdateData();
    }
    
    Redmine.prototype.updateTask = function(task) {
        this.loadAPI({
            action : "updateTask",
            id : task.id,
            subject : task.name,
            estimated_hours : task.estimated,
            assigned_to_id : task.assigned_to_id
        });
        
        for (i = 0; i < this.$scope.tasks.length; i++) {
            if (this.$scope.tasks[ i ].id == task.id) {
                this.$scope.tasks[ i ].name             = task.name;
                this.$scope.tasks[ i ].estimated        = task.estimated;
                this.$scope.tasks[ i ].assigned_to_id   = task.assigned_to_id;
                this.$scope.tasks[ i ].assigned_to_name = task.assigned_to_name;
                break;
            }
        }
        
        this.formatTasksByStory();
        this.kanbam.onUpdateData();
    }
    
    Redmine.prototype.addStory = function(story) {
        this.loadAPI({
            action : "addStory",
            name : story.name,
            date : story.date,
            project_id : this.$scope.currentProject.id
        });
        
        this.allStories.push({
            id : "X",
            name : story.name,
            date : story.date,
            total_estimated : 0
        });
        
        this.reload();
        this.formatTasksByStory();
        this.kanbam.onUpdateData();
    }
    
    Redmine.prototype.addTask = function(task) {
        this.loadAPI({
            action : "addTask",
            name : task.name,
            story_id : task.story_id,
            project_id : this.$scope.currentProject.id,
            activity_id : task.type,
            hours : task.estimated
        }, this.onAddTask);
    
        this.$scope.tasks.push({
            id : "X",
            name : task.name,
            story_id : task.story_id,
            story_name : task.story_name,
            estimated : task.estimated,
            assigned_to_id : "",
            assigned_to_name : "",
            status_id : 1,
            status_name : "TODO",
            type : task.type,
            project_id : this.$scope.currentProject.id
        });
        
        this.formatTasksByStory();
        this.kanbam.onUpdateData();
    }
    
    Redmine.prototype.onAddTask = function() {
        this.reload();
    }
    
    Redmine.prototype.getDateByStoryId = function(id) {
        for (var i = 0; i < this.allStories.length; i++) {
            if (this.allStories[i].id == id) {
                return this.allStories[i].date;
            }
        }
    }
    
    Redmine.prototype.getStoryById = function(id) {
        for (var i = 0; i < this.$scope.stories.length; i++) {
            if (this.$scope.stories[i].id == id) {
                return this.$scope.stories[i];
            }
        }
    }
    
    Redmine.prototype.getTaskVersion = function(issue) {
        if (issue.fixed_version == undefined) {
            return {name : "NO STORY", id : 0};
        } else {
            return issue.fixed_version;
        }
    }
    
    Redmine.prototype.getTaskStatus = function(issue) {
        if ( issue.status.name == "DOING" ) {
            return { id : issue.status.id, name : "DOING" };
        } else if ( issue.status.name == "DONE" ) {
            return { id : issue.status.id, name : "DONE" };
        } else {
            return { id : issue.status.id, name : "TODO" };
        }
    }
    
    Redmine.prototype.isSpentTimeIdUsed = function(id) {
        for ( var i = 0; i < this.listOfSpentTimesUsed.length; i++ ) {
            if ( this.listOfSpentTimesUsed[ i ] == id ) {
                return true;
            }
        }
        
        this.listOfSpentTimesUsed.push( id );
        
        return false;
    } 
    
    Redmine.prototype.reload = function() {
        this.start();
    }
    
    Redmine.prototype.loadAPI = function(e, callback) {
        var self = this;
        
        $.ajax({
            type : 'GET',
            url : this.proxyURI + "&rnd=" + new Date().getTime(),
            data : e,
            success : function(data) {
                if ( callback != undefined ) {
                    if ( data != "" ) {
                        $.proxy(callback, self)(
                            jQuery.parseJSON(data)
                        );
                    } else {
                        $.proxy(callback, self)();
                    }
                }
            }
        });
    }

});