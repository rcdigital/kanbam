/*
tool: "redmine",
apiKey: "62de5239a7d9a370afad56cdf20177235ef77374",
redmineURI: "https://todos.olh.am/"
*/

var App = angular.module('KanbamApp', []);

function Kanbam($scope) {
    $scope.currentProject = {totalSpent : 0, variation: 0, id : -1 };
    
    new KanbamView($scope).startSettings();
}

function KanbamTool($scope) {
    KanbamTool.prototype.startTool = function() {
        if ( $scope.tool == "redmine" ) {
            $scope.toolObj = new KanbamRedmine($scope);
            $scope.toolObj.startRedmine();
        }
    }
}

function KanbamView($scope) {
    var currentPostIt;
    
    $scope.changeProject = function(id) {
        $.cookie("lastProjectId", id)
        
        $scope.histories = [];
        $scope.currentProject.id = id;
        $scope.currentProject.memberships = undefined;
        $scope.toolObj.getTasksByProjectId(id, true);
    }
    
    KanbamView.prototype.startSettings = function() {
        $scope.apiKey = $.cookie("apiKey");
        $scope.redmineURI = $.cookie("redmineURI");
        $scope.currentProject.id = $.cookie("lastProjectId");
        
        $scope.tool = $.cookie("tool");
        
        this.start();
        
        if ( $scope.apiKey == undefined ) {
            $("#settingsModal").modal();
        } else {
            $("#redmineURI").val( $scope.redmineURI );
            $("#apiKey").val( $scope.apiKey );
            
            this.startTool();
        }
    }
    
    KanbamView.prototype.startTool = function() {
        new KanbamTool($scope).startTool();
    }
    
    KanbamView.prototype.start = function() {
        var self = this;
        
        $(".popup").click(function() {
            $(this).hide();
            $scope.toolObj.reload(true);
        });
        
        $(window).mousemove(function(e) {
            if ( e.clientY >= $(window).height() - 80 ) {
                $(".menu").stop().animate({ bottom: 0 }, 250, 'easeOutQuad'  );
            } else {
                var isDropdownOpen = false;
                $(".dropdown-menu").each(function() {
                    if ( !$(this).is(':hidden') ) isDropdownOpen = true; 
                    return;
                });
                
                if ( !isDropdownOpen ) {
                    $(".menu").stop().animate({ bottom: -40 }, 50, 'easeOutQuad' );
                }
            }
        });
        
        // new task actions
        $(".newTask a").click(function(e) {
            e.preventDefault();
            
            $(".menuDetail").hide("fast");
            $(".menu .menuItems .item a").removeAttr("style");
            
            $(".newTaskDetail").css("overflow", "auto");
            $(".newTaskDetail").show("fast", function() {
                $(this).css("overflow", "visible");
            });
            
            $(this).attr("style", "pointer-events: none;");
            $(".newTaskDetail #taskName").focus();
        });
        
        $(".newTaskDetail #taskCancel").click(function() {
            $(".newTaskDetail").hide("fast");
            $(".newTask a").removeAttr("style");
        });
        
        // new history actions
        $(".newHistory a").click(function(e) {
            e.preventDefault();
            
            $(".menuDetail").hide("fast");
            $(".menu .menuItems .item a").removeAttr("style");
            
            $(".newHistoryDetail").css("overflow", "auto");
            $(".newHistoryDetail").show("fast", function() {
                $(this).css("overflow", "visible");
            });
            
            $(this).attr("style", "pointer-events: none;");
            $(".newHistoryDetail #historyName").focus();
        });
        
        $(".newHistoryDetail #historyCancel").click(function() {
            $(".newHistoryDetail").hide("fast");
            $(".newHistory a").removeAttr("style");
        });
        
        // Drop outside window
        document.onmouseup = function(e){
            if ( ( e.clientX > this.documentElement.clientWidth ) || ( e.clientY > this.documentElement.clientHeight ) ) {
                if (self.currentPostIt.hitTestObject($(".deleteTask"))) {
                    self.currentPostIt.mouseup();
                }
            }
        }
        
        $(".settingsBtn .btn").click( function() {
            $("#settingsModal").modal();
        });
        
        //save settings
        $(".saveSettings").click( this.saveSettings );
    }
    
    KanbamView.prototype.saveSettings = function() {
        var self = this;
    
        if ( $("#redmineURI").val() == "" ) {
            $("#redmineURI").parent().parent().addClass("error");
            $("#redmineURI").parent().find(".help-inline").slideDown("fast");
            
            return false;
        } else {
            $("#redmineURI").parent().parent().removeClass("error");
            $("#redmineURI").parent().find(".help-inline").slideUp("hide");
        }
        
        if ( $("#apiKey").val() == "" ) {
            $("#apiKey").parent().parent().addClass("error");
            $("#apiKey").parent().find(".help-inline").slideDown("fast");
            
            return false;
        } else {
            $("#apiKey").parent().parent().removeClass("error");
            $("#apiKey").parent().find(".help-inline").slideUp("fast");
        }
        
        $scope.apiKey = $("#apiKey").val();
        $scope.redmineURI = $("#redmineURI").val();
        $scope.tool = "redmine";
        
        $.cookie("apiKey", $scope.apiKey);
        $.cookie("redmineURI", $scope.redmineURI);
        $.cookie("tool", $scope.tool);
        
        $("#settingsModal").modal("hide");
        
        new KanbamTool($scope).startTool();
    }
    
    KanbamView.prototype.mountTasks = function() {
        var cont = 0;
        var self = this;
        for ( h in $scope.histories ) {
            var groupTasks = [ $scope.histories[h].todo, $scope.histories[h].doing, $scope.histories[h].done ];
            for ( t in groupTasks ) {
                if ( groupTasks[t].length != 0 ) {
                    for ( td in groupTasks[t] ) {
                        var postIt = $( "#post" + (groupTasks[t][td].id) );
                        cont++;
                        postIt.fadeOut(0).delay(( 0.02 * cont * 1000 )).fadeIn( 500 );
                        postIt.dblclick(function() {
                            var openTaskId = $(this).attr("id").substring(4, $(this).attr("id").length);
                            var openTaskDetail = _.find( $scope.tasksList, function( obj ){ return obj.id == openTaskId } );
                            
                            self.createPopover( $(this) );
                            
                            $scope.toolObj.getUsersByProject( openTaskDetail.project.id );
                            
                            $scope.openTask = {};
                            $scope.openTask.id = openTaskId;
                            $scope.openTask.name = openTaskDetail.subject;
                            $scope.openTask.estimated_hours = openTaskDetail.estimated_hours;
                            
                            $(".popover #taskNameEdit").val( $scope.openTask.name );
                            $(".popover #taskEstimatedHours").val( $scope.openTask.estimated_hours );
                            
                            $(".popover .closePopover").click( function() { $(".popover").hide(); })
                            $(".popover .updateTaskDetail").click( function() { s
                                $scope.toolObj.updateTaskDetail({
                                    name : $(".popover #taskNameEdit").val(),
                                    estimated_hours : $(".popover #taskEstimatedHours").val()
                                }); 
                            });
                            
                            $scope.$apply();
                            
                           
                        });
                        
                        postIt.draggable({
                            revert: "invalid", 
                            containment: "document", 
                            cursor: "move", 
                            zIndex: 1000, 
                            drag : function(e, ui) {
                                self.currentPostIt = $(this);
                            
                                if ($(this).hitTestObject($(".deleteTask"))) {
                                    $(this).fadeTo(0, .5);
                                } else {
                                    $(this).fadeTo(0, 1);
                                }
                            }
                        });
                        
                        postIt.bind("mouseup", function(){
                            if ($(this).hitTestObject($(".deleteTask"))) {
                                console.log("delete action");
                                $(this).css("margin-left", -1).css("margin-top", -1); // scroll bug fix                             
                                self.currentPostIt.stop();
                                $(this).hide("scale", { origin : ["bottom", "right"] }, 300);
                            }
                        });
                    }
                }
            }
        }
        
        $(".content").droppable({
            accept: ".post-it",
            drop: function( e, ui ) {
                var dragArea = $(this);
                var postIt = $(ui.draggable);
                
                dragArea.append(postIt);
                postIt.attr("style", "position:relative;");
                dragArea.removeClass("contentHover");
                
                new KanbamRedmine($scope).changeStatus( dragArea.attr("id"), postIt.attr("id").substring(4, postIt.attr("id").length), dragArea.parent().attr("id") );
            },
            over: function( e, ui ) { $(this).addClass("contentHover"); },
            out: function( e, ui ) { $(this).removeClass("contentHover"); }
        });
        
        $(".loading").fadeOut("slow");
    }
    
    KanbamView.prototype.createPopover = function(obj) {
        var taskId =  obj.attr("id").substring(4, obj.attr("id").length);
        
        obj.popover({ title : "Task Edit - #" + taskId , placement : "bottom", trigger : "manual", content : $(".popoverTemplate").html() });
        obj.popover("show");
        
        $(".popover").bind("clickoutside", function() {
            $(this).fadeOut("fast");    
        });
        
        $(".updateOther").click(function(e) {
            e.preventDefault();
            
            $(".popup iframe").attr("src", $scope.redmineURI + "issues/" + taskId);
            $(".popup").fadeIn("fast"); 
            $(".popover").fadeOut("fast");
        });
    }
}

function KanbamRedmine($scope) {
    var typeIdList = [];
    var statusIdList = [];
    var statusIdListGlobal = [];
    var categoryIdList = [];
    var categoryIdListGlobal = [];
    var kView = new KanbamView($scope);
    
    KanbamRedmine.prototype.startRedmine = function() {
        var self = this;
        
        $scope.appURI = "http://kanbam.dev";
        $scope.proxyURI = $scope.appURI + "/redmine.php?api_key=" + $scope.apiKey + "&redmine_uri=" + $scope.redmineURI;
        $scope.projects = [];
        $scope.histories = [];
        $scope.colors = ["", "red", "blue", "green"];
        $scope.tasksList = [];
        $scope.spentTimesAux = [];
        
        this.loadProjects();
    }
    
    KanbamRedmine.prototype.reload = function(isRemount) {
        this.getTasksByProjectId( $scope.projectId, isRemount );
    }
    
    KanbamRedmine.prototype.loadProjects = function() {
        this.proxy("onLoadProjects", "getAllProjects", "", true);
    }
    
    KanbamRedmine.prototype.onLoadProjects = function( e ) {    
        projects = e.projects;
        
        var lastProjectId = -1;
        var lastProjectName = "";
        
        for ( p in projects ){
            if ( projects[ p ].parent != undefined ) {
                parentName = projects[ p ].parent.name;
            } else {
                parentName = "";
            }
        
            $scope.projects.push({
                id : projects[ p ].id,
                name : projects[ p ].name,
                parentName : parentName
            });
            
            if ( $scope.lastProjectId == undefined ) {
                if ( projects[ p ].id > lastProjectId ) {
                    lastProjectId = projects[ p ].id;
                    lastProjectName = projects[ p ].name;
                }
            }
        }
        
        if ( $scope.currentProject.id == null ) {
            $scope.currentProject.id = lastProjectId;
            $scope.currentProject.name = lastProjectName;
        }
        
        $scope.$apply();
        
        this.getTasksByProjectId( $scope.currentProject.id, true );
    }
    
    KanbamRedmine.prototype.getUsersByProject = function( projectId ) {
        var self = this;
        if ( $scope.currentProject.memberships == undefined ) {
            self.proxy("onLoadUsersByProject", "getUsersByProject", "&id=" + projectId, true);
        } else {
            $(".popover .assignedToList").html( $(".popoverTemplate .assignedToList").html() );
            
            $(".popover .dropdown-menu a").click(function(e){
                e.preventDefault();
                self.changeAssignedTo( $(e.target).attr("id"), $(e.target).html() );
            });
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
        
        $(".popover .assignedToList").html( $(".popoverTemplate .assignedToList").html() );
        
        $(".popover .dropdown-menu a").click(function(e){
            e.preventDefault();
            self.changeAssignedTo( $(e.target).attr("id"), $(e.target).html() );
        });
    }
    
    KanbamRedmine.prototype.changeAssignedTo = function(id, name) {
        $(".popover .memberships .btn-label").html( name );
    }
    
    KanbamRedmine.prototype.getSpentTimeByProjectId = function() {
        var self = this;
    
        this.proxy("onLoadSpentTime", "getSpentTimeByProjectId", "&id=" + $scope.currentProject.id, true);
    }   
    
    KanbamRedmine.prototype.onLoadSpentTime = function( e ) {   
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
        self = this;
        
        $scope.projectId = id;
        
        $scope.currentProject.totalEstimated = 0;
        
        if ( $scope.projects.length != 0 ) {
            for ( p in $scope.projects ) {
                if ( $scope.projects[p].id == $scope.currentProject.id ) {
                    $scope.currentProject.name = $scope.projects[p].name;
                    break;
                }
            }
        }
        
        $(".loading").show();
        
        this.proxy("onLoadTasks", "getTasksByProjectId", "&id=" + id, isRemount);
    }
    
    KanbamRedmine.prototype.onLoadTasks = function ( e, isRemount ) {
        var totalTodo = 0;
        var totalDoing = 0;
        var totalDone = 0;
            
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
            
            if ( issues[i].category == undefined ) {
                issues[i].category = { name : "NO HISTORY", id : 0 };
            }
        
            category_id = -1;
            for ( j = 0; j < categoryIdList.length; j++ ) {
                if ( categoryIdList[ j ] == issues[i].category.name ) {
                    category_id = j;
                    break;
                }
            }
            
            if ( category_id == -1 ) {
                categoryIdList.push( { name : issues[i].category.name, id : issues[i].category.id } );
                category_id = categoryIdList.length - 1;
            }
            
            if ( issues[i].estimated_hours != undefined ) $scope.currentProject.totalEstimated += issues[i].estimated_hours;
            
            newIssues.push({
                id : issues[i].id,
                name : issues[i].subject,
                history_id : categoryIdList[ category_id ].id,
                history_name : categoryIdList[ category_id ].name,
                estimated : ( issues[i].estimated_hours == undefined ) ? "0" : issues[i].estimated_hours,
                assigned_to_id : ( issues[i].assigned_to == undefined ) ? "" : issues[i].assigned_to.id,
                assigned_to_name : ( issues[i].assigned_to == undefined ) ? "" : issues[i].assigned_to.name.split(" ")[0],
                status_id : statusIdList[ status_id ].id,
                status_name : statusIdList[ status_id ].name,
                type : $scope.colors[ type_id ]
            });
            
            
        }
        
        $scope.statusIdList = statusIdList;
        $scope.categoryIdList = categoryIdList; 
        
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
        
        totalTasks = totalTodo + totalDoing + totalDone;
        
        $scope.currentProject.totalTodo = Math.round( ( totalTodo / totalTasks ) * 100 );
        $scope.currentProject.totalDoing = Math.round( ( totalDoing / totalTasks ) * 100 );
        $scope.currentProject.totalDone = 100 - $scope.currentProject.totalTodo - $scope.currentProject.totalDoing;
        
        $scope.currentProject.totalEstimated = Math.round($scope.currentProject.totalEstimated);
        $scope.$apply();
        
        kView.mountTasks();
    }
    
    KanbamRedmine.prototype.updateTaskDetail = function( params ) {
        
    }
        
    KanbamRedmine.prototype.changeStatus = function( status, id, history ) {
        var self = this;
        $(".loading").show();
        $(".loading").html("updating...");

        $.ajax({
            type : 'POST',
            url : $scope.appURI + "/redmine.php?api_key=" + $scope.apiKey + "&redmine_uri=" + $scope.redmineURI + "&action=updateTask&status=" + status + "&id=" + id + "&history=" + history,
            success : function(data) {
                $(".loading").fadeOut("slow");
                
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
                url : $scope.proxyURI + "&action=" + action + params,
                success : function(data) {
                    if ( action == "getTasksByProjectId") {
                        if ( ( $scope.lastRequest != data ) || ( $scope.lastProjectId == $scope.currentProject.id ) ) {}
                            eval("self." + dispatcher + "( jQuery.parseJSON(data) )");
                        $scope.lastRequest = data;
                        $scope.lastProjectId = $scope.currentProject.id;
                    } else {
                        eval("self." + dispatcher + "( jQuery.parseJSON(data) )");
                    }
                }
            });
        }
    }
}

Kanbam.$inject = ['$scope', '$rootScope'];