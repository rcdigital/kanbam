var App = angular.module('KanbamApp', []);

function Kanbam($scope) {
    new KanbamView($scope).startSettings();
}

function KanbamView($scope) {
    var currentPostIt;
    
    KanbamView.prototype.startSettings = function() {
        $scope.currentProject = {totalSpent : 0, variation: 0, id : -1 };
        $scope.apiKey = $.cookie("apiKey");
        $scope.redmineURI = $.cookie("redmineURI");
        $scope.currentProject.id = $.cookie("lastProjectId");
        $scope.tool = $.cookie("tool");
        
        this.start();
    }
    
    KanbamView.prototype.start = function() {
        var self = this;
        
        $scope.currentHistory = 0;
        
        if ($scope.apiKey == undefined) {
            $("#settingsModal").modal();
        } else {
            $("#redmineURI").val( $scope.redmineURI );
            $("#apiKey").val( $scope.apiKey );
            
            new KanbamTool($scope).startTool();
        }
        
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
        
        // Save a new task
        $(".saveTask").click(function() {
            if ( $("#taskName").val() == "" ) { 
                alert("Insert a correct task name.");
                return false;
            }
            
            if ( $scope.currentHistory == 0 ) { 
                alert("Choose a history for your task.");
                return false;
            }
            
            $scope.toolObj.addTask( $("#taskName").val(), $scope.currentHistory );
        });
        
        // Save a new history
        $(".saveHistory").click(function() {
            if ( $("#historyName").val() == "" ) { 
                alert("Insert a correct history name.");
                return false;
            }
            
            $scope.toolObj.addHistory( $("#historyName").val() );
        });
        
        // new task actions
        $(".newTask a").click(function(e) {
            e.preventDefault();
            
            $(this).attr("style", "pointer-events: none;");
            
            $(".menuDetail").hide("fast");
            $(".menu .menuItems .item a").removeAttr("style");
            
            $(".newTaskDetail").css("overflow", "auto").show("fast", function() {
                $(this).css("overflow", "visible");
            });
            
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
            
            $(".newHistoryDetail").css("overflow", "auto").show("fast", function() {
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
    
    $scope.changeProject = function(id) {
        $.cookie("lastProjectId", id)
        
        $scope.histories = [];
        $scope.currentProject.id = id;
        $scope.currentProject.memberships = undefined;
        $scope.toolObj.getTasksByProjectId(id, true);
    }
    
    KanbamView.prototype.saveSettings = function() {
        var self = this;
        var redmineURI = $("#redmineURI");
        var apiKey = $("#apiKey");
    
        if (redmineURI.val() == "") {
            redmineURI.parent().parent().addClass("error");
            redmineURI.parent().find(".help-inline").slideDown("fast");
            
            return false;
        } else {
            redmineURI.parent().parent().removeClass("error");
            redmineURI.parent().find(".help-inline").slideUp("hide");
        }
        
        if (apiKey.val() == "") {
            apiKey.parent().parent().addClass("error");
            apiKey.parent().find(".help-inline").slideDown("fast");
            
            return false;
        } else {
            apiKey.parent().parent().removeClass("error");
            apiKey.parent().find(".help-inline").slideUp("fast");
        }
        
        $scope.apiKey = apiKey.val();
        $scope.redmineURI = redmineURI.val();
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
        
        for (h in $scope.histories) {
            if ($scope.histories[h].todo != undefined) {
                var groupTasks = [$scope.histories[h].todo, $scope.histories[h].doing, $scope.histories[h].done];
                
                for (t in groupTasks) {
                    if (groupTasks[t].length != 0) {
                        for (td in groupTasks[t]) {
                            var postIt = $( "#post" + (groupTasks[t][td].id) );
                            
                            cont++;
                            postIt.fadeOut(0).delay(( 0.02 * cont * 1000 )).fadeIn( 500 );
                            
                            postIt.dblclick(function() {
                                var openTaskId = $(this).attr("id").substring(4, $(this).attr("id").length);
                                var openTaskDetail = _.find( $scope.tasksList, function( obj ){ return obj.id == openTaskId } );
   
                                self.createPopover( $(this) );    
                                
                                $scope.toolObj.getUsersByProject( openTaskDetail.project.id );
                                
                                $scope.updateTask = {};
                                $scope.updateTask.id = openTaskId;
                                $scope.updateTask.name = openTaskDetail.subject;
                                $scope.updateTask.estimated_hours = openTaskDetail.estimated_hours;
                                $scope.updateTask.assigned_to = {};
                                
                                if (openTaskDetail.assigned_to == undefined) {
                                    $scope.updateTask.assigned_to.id = -1;
                                    $scope.updateTask.assigned_to.name = "Select a user";
                                } else {
                                    $scope.updateTask.assigned_to = openTaskDetail.assigned_to;
                                }
                                
                                self.changeAssignedTo( $scope.updateTask.assigned_to.id, $scope.updateTask.assigned_to.name );
                                
                                $(".popover #taskNameEdit").val( $scope.updateTask.name );
                                $(".popover #taskEstimatedHours").val( $scope.updateTask.estimated_hours );
                                
                                $(".popover .closePopover").click( function(e) { 
                                    e.preventDefault();
                                    
                                    $(".popover").remove();
                                });
                                
                                $(".popover .updateTaskDetail").click( function() { s
                                    self.updateTaskDetail( openTaskId ); 
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
                                    
                                    var id = $(this).attr("id").substring(4, $(this).attr("id").length );
                                    
                                    $scope.toolObj.removeTask( id );
                                    
                                    $(this).css("margin-left", -1).css("margin-top", -1); // scroll bug fix                             
                                    self.currentPostIt.stop();
                                    $(this).hide("scale", { origin : ["bottom", "right"] }, 300);
                                }
                            });
                        }
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
        
        // Change history in add task
        $(".taskHistory ul li a").click(function(e) {
            e.preventDefault();
            
            $(".taskHistory .btn-label").html( $(this).html() );
            
            $scope.currentHistory = $(this).attr("id");
        });
        
        $(".loading").fadeOut("slow");
    }
    
    KanbamView.prototype.createPopover = function(obj) {
        var taskId =  obj.attr("id").substring(4, obj.attr("id").length);
        
        obj.popover({ title : "Task Edit - #" + taskId , placement : "bottom", trigger : "manual", content : $(".popoverTemplate").html() });
        obj.popover("show");
        
        $(".popover").bind("clickoutside", function() {
            $(this).remove();   
        });
        
        $(".updateOther").click(function(e) {
            e.preventDefault();
            
            $(".popup iframe").attr("src", $scope.redmineURI + "issues/" + taskId);
            $(".popup").fadeIn("fast"); 
            $(".popover").remove();
        });
    }
    
    KanbamView.prototype.mountProjects = function() {
        $(".changeProject ul li a").click(function(e) {
            e.preventDefault();
            
            $scope.changeProject( $(this).attr("id") );
        });
    }
    
    KanbamView.prototype.mountUsers = function() {
        $(".popover .memberships ul li a").click(function(e) {
            e.preventDefault();
            
            $scope.updateTask.assigned_to.id = $(this).attr("id");
            $scope.updateTask.assigned_to.name = $(this).html();
        });
    }
    
    KanbamView.prototype.onUpdateTaskDetail = function() {
        $(".popover").remove(); 
        
        $scope.toolObj.reload(true);
    }

    KanbamView.prototype.onUpdateTaskDetail = function() {    
        $(".popover .assignedToList").html($(".popoverTemplate .assignedToList").html());
            
        $(".popover .dropdown-menu a").click(function(e){
            e.preventDefault();
            $scope.toolObj.changeAssignedTo( $(e.target).attr("id"), $(e.target).html() );
        });
    }
    
    KanbamView.prototype.changeAssignedTo = function(id, name) {
        $scope.updateTask.assigned_to.id = id;
        $(".popover .memberships .btn-label").html( name );
    }
    
    KanbamView.prototype.loadingShow = function() {
        $(".loading").fadeIn("slow");
    }
    
    KanbamView.prototype.loadingHide = function() {
        $(".loading").fadeOut("slow");
    }
    
    KanbamView.prototype.updateTaskDetail = function( id ) {
        if ( $(".popover #taskNameEdit").val().trim() == "" ) {
            $(".popover #taskNameEdit").parent().parent().addClass("error");
            
            return false;
        } else {
            $(".popover #taskNameEdit").parent().parent().removeClass("error");
        }
        
        if ( 
            ( isNaN( $(".popover #taskEstimatedHours").val()) ) ||
            ( parseFloat($(".popover #taskEstimatedHours").val() ) < 0 ) 
        ) {
            $(".popover #taskEstimatedHours").parent().parent().addClass("error");
            
            return false;
        } else {
            $(".popover #taskEstimatedHours").parent().parent().removeClass("error");
        }
        
        $scope.toolObj.proxy("onUpdateTaskDetail", "updateTaskDetail", "&id=" + id + "&subject=" + $(".popover #taskNameEdit").val() + "&estimated_hours=" + $(".popover #taskEstimatedHours").val() + "&assigned_to_id=" + $scope.updateTask.assigned_to.id, true );
    }
}

function KanbamTool($scope) {
    KanbamTool.prototype.startTool = function() {
        if ($scope.tool == "redmine") {
            $scope.toolObj = new KanbamRedmine($scope);
            $scope.toolObj.startRedmine();
        }
    }
}

Kanbam.$inject = ['$scope'];