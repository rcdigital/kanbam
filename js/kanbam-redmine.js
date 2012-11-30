function KanbamRedmine($scope) {
    var typeIdList = [];
    var statusIdList = [];
    var statusIdListGlobal = [];
    var fixedVersionIdList = [];
    var fixedVersionIdListGlobal = [];
    var kView = new KanbamView($scope);
    
    KanbamRedmine.prototype.startRedmine = function() {
        var self = this;
        
        $scope.appURI = "//" + window.location.host + window.location.pathname;
        $scope.proxyURI = $scope.appURI + "redmine.php?api_key=" + $scope.apiKey + "&redmine_uri=" + $scope.redmineURI;
        $scope.projects = [];
        $scope.histories = [];
        $scope.colors = ["", "red", "blue", "green"];
        $scope.tasksList = [];
        $scope.spentTimesAux = [];
        
        this.loadProjects();
    }
    
    KanbamRedmine.prototype.reload = function(isRemount) {
        this.getTasksByProjectId($scope.projectId, isRemount);
    }
    
    KanbamRedmine.prototype.getAllHistories = function(project_id) {
        this.proxy("onLoadAllHistories", "getAllHistories", "&project_id=" + project_id, true);
    }
    
    KanbamRedmine.prototype.onLoadAllHistories = function(e) {
        var allHistories = [];
        
        for (v in e.versions) {
            allHistories.push({ 
                name : e.versions[v].name, 
                id : e.versions[v].id, 
                total_estimated : 0 
            });
        }
        
        $scope.allHistories = allHistories;
        
        this.loadTasksProject();
    }
    
    KanbamRedmine.prototype.loadProjects = function() {
        this.proxy("onLoadProjects", "getAllProjects", "", true);
    }
    
    KanbamRedmine.prototype.onLoadProjects = function(e) {
        var lastProjectId = -1;
        var lastProjectName = "";
        
        projects = e.projects;
        
        for (p in projects){
            parentName = (projects[p].parent != undefined) ? projects[p].parent.name : "";
        
            $scope.projects.push({
                id : projects[p].id,
                name : projects[p].name,
                parentName : parentName
            });
            
            if ($scope.lastProjectId == undefined) {
                if (projects[p].id > lastProjectId) {
                    lastProjectId = projects[p].id;
                    lastProjectName = projects[p].name;
                }
            }
        }
        
        if ($scope.currentProject.id == null) {
            $scope.currentProject.id = lastProjectId;
            $scope.currentProject.name = lastProjectName;
        }
        
        $scope.$apply();
        
        kView.mountProjects();
        
        this.getTasksByProjectId($scope.currentProject.id, true);
    }
    
    KanbamRedmine.prototype.getUsersByProject = function( projectId ) {
        var self = this;
        
        if ($scope.currentProject.memberships == undefined) {
            self.proxy("onLoadUsersByProject", "getUsersByProject", "&id=" + projectId, true);
        } else {
            kView.addAssignedTo();
        }
    }
    
    KanbamRedmine.prototype.onLoadUsersByProject = function( e ) {  
        var memberships = e.memberships;
        var self = this;
        
        $scope.currentProject.memberships = [];
        
        for ( m in memberships ) {
            $scope.currentProject.memberships.push( memberships[ m ].user );
        }
        
        $scope.$apply();
        
        kView.onUpdateTaskDetail();
        kView.mountUsers();
    }
    
    KanbamRedmine.prototype.getSpentTimeByProjectId = function() {
        var self = this;
    
        this.proxy("onLoadSpentTime", "getSpentTimeByProjectId", "&id=" + $scope.currentProject.id, true);
    }   
    
    KanbamRedmine.prototype.onLoadSpentTime = function(e) {   
        spentTime = e.time_entries;
        $scope.currentProject.totalSpent = Math.round(_.reduce(spentTime, function(memo, issue){ return memo + parseFloat( issue.hours ); }, 0));
        
        var timeSpentEstimated = 0;
        this.spentTimesAux = [];
        
        for ( s in spentTime ) {
            for ( t in $scope.tasksList ) {
                if ( spentTime[s].issue != undefined )      
                    if ( spentTime[s].issue.id == $scope.tasksList[t].id )
                        if ( $scope.tasksList[t].estimated_hours != undefined ) {
                            if ( !self.hasIdSpentEstimated( spentTime[s].issue.id ) ) {
                                timeSpentEstimated += $scope.tasksList[t].estimated_hours;
                                this.spentTimesAux.push(spentTime[s].issue.id);
                            }
                        }
            }   
        }
        
        $scope.currentProject.timeSpentEstimated = timeSpentEstimated;
        
        if ( timeSpentEstimated == 0 ) timeSpentEstimated = 1;
        
        var variation = ( 100 - Math.round( ( $scope.currentProject.totalSpent * 100 ) / timeSpentEstimated ) );
        var variationComparation = ( variation < 0 ) ? variation * -1 : variation;
        
        if ( ( variationComparation / 1000 ) > 1 ) {
            value = parseInt( variation / 1000 );
            type = "k"; 
        } else { 
            value = variation;
            type = ""; 
        }
        
        $scope.currentProject.variation = ( value >= 0 ) ? "+" + value + type : value + type;
        $scope.$apply();
    }
    
    KanbamRedmine.prototype.hasIdSpentEstimated = function( id ) {
        for ( i = 0; i < $scope.spentTimesAux.length; i++ ) 
            if ( $scope.spentTimesAux[ i ] == id ) return true;
        
        return false;
    }
    
    KanbamRedmine.prototype.getTasksByProjectId = function( id, isRemount ) {
        $scope.isRemount = isRemount;
        
        this.getAllHistories(id);
        
        $scope.projectId = id;
    }
    
    KanbamRedmine.prototype.loadTasksProject = function() {
    
    
        $scope.currentProject.totalEstimated = 0;
        
        if ( $scope.projects.length != 0 ) {
            for ( p in $scope.projects ) {
                if ( $scope.projects[p].id == $scope.currentProject.id ) {
                    $scope.currentProject.name = $scope.projects[p].name;
                    break;
                }
            }
        }
        
        kView.loadingShow();
        
        this.proxy("onLoadTasks", "getTasksByProjectId", "&id=" + $scope.projectId, $scope.isRemount );
    }
    
    KanbamRedmine.prototype.onLoadTasks = function ( e, isRemount ) {
        var totalTodo = 0;
        var totalDoing = 0;
        var totalDone = 0;
        
        self = this;
            
        issues = e.issues;
        newIssues = [];
        
        self.getSpentTimeByProjectId();
        
        $scope.currentProject.totalEstimated = 0;
        
        $scope.tasksList = issues; 
        
        for ( i in issues ) {
            status_id = -1;
            for ( j = 0; j < statusIdList.length; j++ ) {
                if ( statusIdList[ j ].id == issues[i].status.id ) {
                    status_id = j;
                    break;
                }
            }
            
            if ( status_id == -1 ) {
                if ( issues[i].status.name == "DOING" ) {
                    status = "DOING";
                } else if ( issues[i].status.name == "DONE" ) {
                    status = "DONE";
                } else {
                    status = "TODO";
                }
                
                statusIdList.push( { id : issues[i].status.id, name: status } );
                status_id = statusIdList.length - 1;
            }
            
            
            if ( issues[i].status.name == "DOING" ) {
                totalDoing += ( issues[i].estimated_hours == undefined ) ? 0 : issues[i].estimated_hours;
            } else if ( issues[i].status.name == "DONE" ) {
                totalDone += ( issues[i].estimated_hours == undefined ) ? 0 : issues[i].estimated_hours;
            } else {
                totalTodo += ( issues[i].estimated_hours == undefined ) ? 0 : issues[i].estimated_hours;
            }
            
            type_id = -1;
            for ( j = 0; j < typeIdList.length; j++ ) {
                if ( typeIdList[ j ] == issues[i].tracker.name ) {
                    type_id = j;
                    break;
                }
            }
            
            if ( type_id == -1 ) {
                typeIdList.push( issues[i].tracker.name );
                type_id = typeIdList.length - 1;
            }
            
            if ( issues[i].fixed_version == undefined ) {
                issues[i].fixed_version = { name : "NO HISTORY", id : 0 };
            }
        
            fixed_version_id = -1;
            for ( j = 0; j < fixedVersionIdList.length; j++ ) {
                if ( fixedVersionIdList[ j ] == issues[i].fixed_version.name ) {
                    fixed_version_id = j;
                    break;
                }
            }
            
            if ( fixed_version_id == -1 ) {
                fixedVersionIdList.push( { name : issues[i].fixed_version.name, id : issues[i].fixed_version.id } );
                fixed_version_id = fixedVersionIdList.length - 1;
            }
            
            if ( issues[i].estimated_hours != undefined ) $scope.currentProject.totalEstimated += issues[i].estimated_hours;
            
            newIssues.push({
                id : issues[i].id,
                name : issues[i].subject,
                history_id : fixedVersionIdList[ fixed_version_id ].id,
                history_name : fixedVersionIdList[ fixed_version_id ].name,
                estimated : ( issues[i].estimated_hours == undefined ) ? "0" : issues[i].estimated_hours,
                assigned_to_id : ( issues[i].assigned_to == undefined ) ? "" : issues[i].assigned_to.id,
                assigned_to_name : ( issues[i].assigned_to == undefined ) ? "" : issues[i].assigned_to.name.split(" ")[0],
                status_id : statusIdList[ status_id ].id,
                status_name : statusIdList[ status_id ].name,
                type : $scope.colors[ type_id ]
            });
            
            
        }
        
        $scope.statusIdList = statusIdList;
        $scope.fixedVersionIdList = fixedVersionIdList; 
        
        ta = _.groupBy(newIssues, function(issue) { return issue.history_name; } );
        
        $scope.histories = []; i = 0;
        for ( t in ta ) {
            t_todo = _.filter(ta[t], function(issue) { return ( issue.status_name == "TODO" ) == 1; } );
            t_doing = _.filter(ta[t], function(issue) { return ( issue.status_name == "DOING" ) == 1; } );
            t_done = _.filter(ta[t], function(issue) { return ( issue.status_name == "DONE" ) == 1; } );
            
            var totalEstimated = _.reduce(ta[t], function(memo, issue){ return memo + parseFloat( issue.estimated ); }, 0);
            
            $scope.histories.push({ name: t, id: ta[t][0].history_id, total_estimated: totalEstimated, todo: t_todo, doing: t_doing, done: t_done });
            $scope.histories = _.sortBy($scope.histories, function(task){ return task.name; });
            
            i++;
        }
        
          
        $scope.histories = _.uniq(_.union( $scope.histories, $scope.allHistories ), false, function(p){ return p.id; });
        
        totalTasks = totalTodo + totalDoing + totalDone;
        
        $scope.currentProject.totalTodo = Math.round( ( totalTodo / totalTasks ) * 100 );
        $scope.currentProject.totalDoing = Math.round( ( totalDoing / totalTasks ) * 100 );
        $scope.currentProject.totalDone = 100 - $scope.currentProject.totalTodo - $scope.currentProject.totalDoing;
        
        $scope.currentProject.totalEstimated = Math.round($scope.currentProject.totalEstimated);
        $scope.$apply();
        
        kView.mountTasks();
    }
    
    KanbamRedmine.prototype.addTask = function() {
        
    }
    
    KanbamRedmine.prototype.onUpdateTaskDetail = function() {
        kView.onUpdateTaskDetail();
    }
        
    KanbamRedmine.prototype.changeStatus = function( status, id, history ) {
        var self = this;
        kView.loadingShow();
        
        if ( history == 0 ) history = "NO HISTORY";

        $.ajax({
            type : 'POST',
            url : $scope.appURI + "redmine.php?api_key=" + $scope.apiKey + "&redmine_uri=" + $scope.redmineURI + "&action=updateTask&status=" + status + "&id=" + id + "&history=" + history,
            success : function(data) {
                kView.loadingHide();
                
                self.reload(false);
            }
        });
        
        clearInterval($scope.intervalReload);
        //$scope.intervalReload = setInterval( function() { self.reload(true); }, 10000);
    }
    
    KanbamRedmine.prototype.proxy = function(dispatcher, action, params, isRemount) {
        if ( isRemount ) {
            var self = this;
            
            $.ajax({
                type : 'POST',
                url : $scope.proxyURI + "&rnd=" + new Date().getTime() + "&action=" + action + params,
                success : function(data) {
                    if ( action == "getTasksByProjectId") {
                        if ( ( $scope.lastRequest != data ) || ( $scope.lastProjectId == $scope.currentProject.id ) ) {}
                            eval("self." + dispatcher + "( jQuery.parseJSON(data) )");
                        $scope.lastRequest = data;
                        $scope.lastProjectId = $scope.currentProject.id;
                    } else if ( action == "updateTaskDetail" ) {
                        eval("self." + dispatcher + "()");
                    } else {
                        eval("self." + dispatcher + "( jQuery.parseJSON(data) )");
                    }
                }
            });
        }
    }
}
