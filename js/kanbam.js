/*!
* Kanb.am by @marloscarmo
* Author: Marlos Carmo
* http://www.apache.org/licenses/LICENSE-2.0.txt
*/

define(['jquery', 'plugins', 'exports', 'bootstrap', 'datepicker', 'tool', 'jqueryui', 'presentation'], function($, plugins, exports, bootstrap, datepicker, tool, jqueryui, presentation){

    exports.init = function($scope) {
        var kanbam = new Kanbam($scope);
        kanbam.startEvents();
        kanbam.start();
    };
    
    var Kanbam = function($scope) {
        this.$scope = $scope;
    };
    
    Kanbam.prototype.start = function() {
        var self = this;
        this.$scope.kanbam = this;
        this.currentPostIt = -1;
        this.currentStory = 0;
        this.currentActivity = 0;
        this.isCtrlDown = false;
        this.isPlaying = true;
        
        this.$scope.editTask = { assigned_to_id : -1, assigned_to_name : "Select an user" };
        
        this.$scope.colors = ["", "red", "blue", "green", "purple", "orange", "gray"];
        this.$scope.settings = { appURI : "//" + window.location.host + window.location.pathname };
        
        this.getCookiesSettings();
        
        this.$scope.tool = tool;
        this.$scope.tool.init(this.$scope, this);

        this.$scope.presentation = presentation;
        this.$scope.presentation.init(this.$scope);

        $(".story-date").datepicker({ autoclose : true });
        $(".search-value").hide();
        $(".footer").stop().animate({ bottom: -46 }, 50, 'easeOutQuad' );
        
        if ( this.$scope.settings.apiKey === undefined ) {
            $(".settings").modal();
        } else {
            $(".redmine-uri").val( this.$scope.settings.redmineURI );
            $(".api-key").val( this.$scope.settings.apiKey );
            
            this.$scope.tool.start();
        }
        
        $(window).resize(function() {
            self.fixStoryCell();
            self.fixStoryHeight();
        });
        
        //Shortcut for search
        $(document).keydown(function(e) {
            if ( e.which == 17 ) {
                this.isCtrlDown = true;
            }
            
            if ( this.isCtrlDown && e.which == 70 ) {
                $(".search-btn .btn").click();
            }
        });
        
        $(document).keyup(function(e) {
            if ( e.which == 17 ) {
                this.isCtrlDown = false;
            }
        });
        
        $(".search-value").keyup(function() {
            self.search( $(this).val() ); 
        });
        
        $(".search-btn .btn").click(function() {
            $(".search-value").animate({width:'toggle'},350);
            $(".search-value").select();
        });
        
        this.$scope.formatHour = function(hour, isZero) {
            if ( hour === 0 || hour === undefined ) {
                if ( isZero ) {
                    return "0h";
                } else {
                    return "";
                }
            } else {
                return hour + "h";
            }
        };
        
        this.$scope.formatDate = function(date) {
            if ( ( date !== "" ) && ( date !== undefined ) ) {
                var d = date.split("-")[2];
                var m = parseInt( date.split("-")[1], 10 );
                var nameOfMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                
                return nameOfMonths[ parseInt(m, 10) - 1 ] + " " + d;
            }
        };
        
        this.$scope.formatUserName = function(name) {
            return String(name).split(" ")[0];
        };
        
        this.$scope.formatColorPost = function(id) {
            return self.getActivityColorById(id);
        };
        
        this.$scope.getColorByVariation = function(variation) {
            if ( ( variation <= 10 ) && ( variation >= 0 ) ) {
                return "indicator-attention";
            } else if ( variation < 0 ) {
                return "indicator-success";
            } else {
                return "indicator-error";
            }
        };
        
        this.$scope.formatVariation = function(variation) {
            if ( variation === null || variation === undefined || variation === "undefined" || isNaN( variation ) ) {
                return 0;
            }
            
            if ( ( variation >= 1000 ) || ( variation <= -1000 ) ) {
               variation = (variation / 1000).toFixed(1) + "K";
            }
            
            return variation;
        };
        
        this.$scope.isFirstStory = function(index) {
            if ( index === 0 ) {
                return "first-story";
            } else {
                return "";
            }
        };

        $(".project-action").click(function() {
            self.togglePresentationAction();
        });
    };
    
    Kanbam.prototype.startEvents = function() {
        var self = this;
        this.isFooterOpen = false;
    
        $(".save-settings").click( this.saveSettings );
        $(".close-settings").click( function() {
            $(".loading").hide();

            if ( this.isPresentationMode() ) {
                this.$scope.presentation.play();
            }
        });
         
        $(".settings-btn").click( function() {
            this.$scope.presentation.pause();
            $(".settings").modal();
        });
        
        $(window).mousemove(function(e) {
            if ( !self.isPresentationMode() ) {
                if ( !$(".dropdown-menu").is(":visible") && !$(".datepicker").is(":visible") && !$(".detail").is(":visible") ) {
                    if (e.clientY >= $(window).height() - 150) {
                        if (!self.isFooterOpen) {
                            $(".footer").stop().animate({ bottom: 0 }, 150, 'easeOutQuad' );
                            $(".stories").animate({ marginBottom: 63 }, 250, 'easeOutQuad' );
                            
                            if ( $(document).height() <= $(document).scrollTop() + $(window).height() + 64 ) {
                                $('html, body').animate({ scrollTop: 999999 }, 350);
                            }
                        }
                        self.isFooterOpen = true;
                    } else {
                        if (self.isFooterOpen) {
                            $(".footer").stop().animate({ bottom: -46 }, 250, 'easeOutQuad' );
                            $(".stories").animate({ marginBottom: 17 }, 150, 'easeOutQuad' );
                        }
                        self.isFooterOpen = false;
                    }
                }
            } 
        });
        
        $("#new-task-form").submit(function() {
            if ( $(".task-name").val() === "" ) { 
                alert("Insert a correct task name.");
                return false;
            }
            
            if ( isNaN( $(".task-hours").val() ) ) { 
                alert("Insert only numbers in task hours.");
                return false;
            }
            
            if ( self.currentActivity === 0 ) { 
                alert("Choose a activity for your task.");
                return false;
            }
            
            if ( self.currentStory === 0 ) { 
                alert("Choose a story for your task.");
                return false;
            }
            
            self.$scope.tool.addTask({
                name : $(".task-name").val(),
                story_id : Number( self.currentStory ),
                story_name : $(".task-story-label").html(),
                type : self.currentActivity,
                estimated : Number( $(".task-hours").val() )
            });
            
            $(".task-name").val("");
            $(".task-name").focus();
            $(".task-hours").val("");
            
            return false;
        });
        
        $("#new-story-form").submit(function() {
            if ( $(".story-name").val() === "" ) { 
                alert("Insert a correct story name.");
                return false;
            }
            
            self.$scope.tool.addStory( {
                name : $(".story-name").val(),
                date : self.formatDate( $(".story-date").val() )
            });
            
            $(".story-name").val("");
            
            return false;
        });
        
        $(".new-task-btn").click(function(e) {
            e.preventDefault();
            
            $(".footer-detail").hide("fast");
            
            $(".task-detail").css("overflow", "auto").show("fast", function() {
                $(this).css("overflow", "visible");
            });
            
            $(".task-name").focus();
        });
        
        $(".task-cancel").click(function() {
            $(".task-detail").hide("fast");
        });
        
        $(".new-story-btn").click(function(e) {
            e.preventDefault();
            
            $(".footer-detail").hide("fast");
            
            $(".story-detail").css("overflow", "auto").show("fast", function() {
                $(this).css("overflow", "visible");
            });
            
            $(".story-name").focus();
        });
        
        $(".story-cancel").click(function() {
            $(".story-detail").hide("fast");
        });
        
        $(".settings-btn").click( function() {
            $(".settings").modal();
        });
        
        $(".detail-spent-add").click(function(e) {
            e.preventDefault();
            self.addSpentTime();
        });
        
        $(".task-advanced-edit").click(function() {
            $(this).hide();
            $(".detail").fadeOut("fast");
            self.$scope.tool.reload();
        });
    };
    
    Kanbam.prototype.projectsEvents = function() {
        var self = this;
        $(".loading-icon").fadeIn("fast");
        $(".settings-view-mode").slideDown("fast");

        this.$scope.presentation.getSavedProjects();
        
        this.$scope.settings.viewMode = $.cookie("viewMode");

        if ( this.$scope.settings.viewMode == "Presentation mode" ) {
            this.changeViewMode("presentation");
        } else {
            this.changeViewMode("user");
        }

        $(".project-list a").click(function(e) {
            e.preventDefault();
            $(".loading").show();

            self.$scope.tool.changeProject( $(this).attr("id") );
        });
        
        $(".task-activity a").click(function(e) {
            e.preventDefault();
            $(".task-activity-label").html( $(this).html() );
            self.currentActivity = $(this).attr("id");
        });
        
        $(".settings-view-mode a").click(function(e) {
            e.preventDefault();
            self.changeViewMode( $(this).attr("id") );
        });

        if ( self.isPresentationMode() ) {
            $(".project-action").show();
        } else {
            $(".project-action").hide();
        }
    };
    
    Kanbam.prototype.tasksEvents = function() {
        var self = this;
        $(".tasks-td").droppable({
            accept: ".post-it",
            drop: function( e, ui ) {
                var dragArea = $(this);
                var postIt = $(ui.draggable);
                var postItId = postIt.attr("id").split("post")[1];
                var status = dragArea.attr("id");
                
                dragArea.append(postIt);
                postIt.attr("style", "position:relative;");
                dragArea.removeClass("tasks-td-hover");
                
                self.$scope.tool.changeStatusTask({
                    id : postItId,
                    status : status,
                    story : dragArea.parent().attr("id")
                });
                
                if ( status == "DONE" ) {
                    self.showEditTask(postItId);
                } else {
                    self.hideEditTask();
                }
                
                self.fixStoryCell();
            },
            over: function( e, ui ) { $(this).addClass("tasks-td-hover"); },
            out: function( e, ui ) { $(this).removeClass("tasks-td-hover"); }
        });
        
        $(".task-story a").click(function(e) {
            e.preventDefault();
            $(".task-story-label").html( $(this).html() );
            self.currentStory = $(this).attr("id");
        });
    };
    
    Kanbam.prototype.editEvents = function() {
        var self = this;
        $(".detail-close").click( function(e) { 
            e.preventDefault();
            self.hideEditTask();
        });
        
        $(".detail-remove").click( function(e) {
            e.preventDefault();
            
            $(".detail").fadeOut("fast"); 
            $('#post' + self.$scope.editTask.id).slideUp('fast');
            self.$scope.tool.removeTask( self.$scope.editTask.id );
        });
        
        $(".detail-update").click( function(e) {
            e.preventDefault();
            self.updateTaskDetail( self.$scope.editTask.id ); 
        });
        
        $(".detail-assigned-to-list a").click(function(e) {
            e.preventDefault();
            
            self.$scope.editTask.assigned_to_id = $(this).attr("id");
            self.$scope.editTask.assigned_to_name = $(this).html();
            $(".detail-assigned-to .btn-label").html( $(this).html() );
        });
        
        $(".detail-spent-activities-list a").click(function(e) {
            e.preventDefault();
            
            self.$scope.editTask.spent_time_activity_id = $(this).attr("id");
            self.$scope.editTask.spent_time_activity_name = $(this).html();
            $(".detail-spent-activities .btn-label").html( $(this).html() );
        });
        
        this.spentTimeEvents();
    };
    
    Kanbam.prototype.changeViewMode = function(mode) {
        var self = this;
        $(".loading").show();

        if ( mode == "presentation" ) {
            self.$scope.presentation.getSavedProjects();

            $(".view-mode-label").html( "Presentation mode" );
            $(".footer").hide();
            //$("body").css("overflow", "hidden");

            $(".settings-list-projects").slideDown("fast");
            $(".modal-body").removeClass("modal-body-default");
            $(".modal-body").addClass("modal-body-open");
        } else {
            $(".view-mode-label").html( "User mode" );
            $(".footer").show();
            self.$scope.presentation.pause();
            //$("body").css("overflow", "auto");
            
            $(".settings-list-projects").slideUp("fast");
            $(".modal-body").removeClass("modal-body-open");
            $(".modal-body").addClass("modal-body-default");
        }
    };
    
    Kanbam.prototype.spentTimeEvents = function() {
        var self = this;
        $(".detail-spent-remove").click(function(e){
            e.preventDefault();
            self.$scope.tool.removeSpentTime( $(this).attr("id") );
        });
    };
    
    Kanbam.prototype.saveSettings = function() {
        var redmineURI = $(".redmine-uri");
        var apiKey = $(".api-key");
        var viewMode = $(".settings-view-mode");
        var viewModeLabel = $(".view-mode-label").html();

        if (redmineURI.val() === "") {
            redmineURI.parent().parent().addClass("error");
            redmineURI.parent().find(".help-inline").slideDown("fast");
            
            return false;
        } else {
            redmineURI.parent().parent().removeClass("error");
            redmineURI.parent().find(".help-inline").slideUp("hide");
        }
        
        if (apiKey.val() === "") {
            apiKey.parent().parent().addClass("error");
            apiKey.parent().find(".help-inline").slideDown("fast");
            
            return false;
        } else {
            apiKey.parent().parent().removeClass("error");
            apiKey.parent().find(".help-inline").slideUp("fast");
        }
        
        this.$scope.settings.apiKey     = apiKey.val();
        this.$scope.settings.redmineURI = redmineURI.val();
        this.$scope.settings.tool       = "redmine";

        $.cookie("apiKey", this.$scope.settings.apiKey);
        $.cookie("redmineURI", this.$scope.settings.redmineURI);
        $.cookie("tool", this.$scope.settings.tool);
        
        this.$scope.settings.viewMode = viewModeLabel;
        $.cookie("viewMode", viewModeLabel);

        if ( viewModeLabel == "User mode" ) {
            this.$scope.presentation.pause();
        } else {
            this.$scope.presentation.saveProjects();
            $(".stories").attr("style", "margin-bottom:0px;");
        }

        $(".settings").modal("hide");
        
        this.$scope.tool.start();
    };
    
    Kanbam.prototype.addSpentTime = function() {
        var spentHours = $(".detail-spent-hours");
    
        if ( spentHours.val() === "" ) {
            $(".detail-spent-error").show("fast");
            return false;
        }
        
        if ( this.$scope.editTask.spent_time_activity_name === undefined ) {
            $(".detail-spent-error").show("fast");
            return false;
        } else {
            spentHours.parent().parent().removeClass("error");
        }
        
        $(".detail-spent-error").hide("fast");
    
        this.$scope.tool.addSpentTime({
            issueId : this.$scope.editTask.id,
            hours : spentHours.val(),
            activityId : this.$scope.editTask.spent_time_activity_id,
            activityName : this.$scope.editTask.spent_time_activity_name
        });
    };
    
    Kanbam.prototype.renderTasks = function() {
        var self = this;
        var dragGetObj = function(e, ui) { this.currentPostIt = $(this); };
        for (var h in this.$scope.stories) {
            var groupColumns = [
                this.$scope.stories[h].todo, 
                this.$scope.stories[h].doing, 
                this.$scope.stories[h].done
            ];
            
            for ( var gc in groupColumns) {
                for ( var t in groupColumns[gc]) {
                    var postIt = $( "#post" + (groupColumns[gc][t].id) );
                    
                    postIt.bind('dblclick', this.doubleClickPostIt);
                    
                    postIt.draggable({
                        revert: "invalid", 
                        containment: "document", 
                        cursor: "move", 
                        zIndex: 1000,
                        drag : dragGetObj
                    });
                }
            }
        }
        
        this.fixStoryHeight();
        this.fixStoryCell();
        this.tasksEvents();

        $(".loading").hide(0, function() {
            $("body").scrollTop(0);
            if ( self.isPresentationMode() ) {
                self.$scope.presentation.play();
            }
        });
    };
    
    Kanbam.prototype.doubleClickPostIt = function(e) {
        this.onUpdateData();
        this.showEditTask(e.currentTarget.id.split("post")[1]);
    };
    
    Kanbam.prototype.showEditTask = function(id) {
        var self = this;
        var task = _.find( this.$scope.tasks, function(task){ return task.id === id; } );
                
        this.$scope.editTask = task;
        
        if (this.$scope.editTask.assigned_to_name === "") {
            $(".detail-assigned-to .btn-label").html( "Select an user" );
        } else {
            $(".detail-assigned-to .btn-label").html( this.$scope.editTask.assigned_to_name );
        }
        
        this.onUpdateData();
    
        $(".detail").show();
        
        $(".detail-spent-activities .btn-label").html( "Select an activity" );
        $(".detail-spent-hours").val("");
        $(".detail-spent-hours").focus();
        
        $(".detail-advanced-edit").click(function(e) {
            e.preventDefault();
            
            $(".task-advanced-edit iframe").attr("src", self.$scope.settings.redmineURI + "issues/" + id);
            $(".task-advanced-edit").fadeIn("fast");
        });
        
        this.movePositionPopover(id);
        
        this.editEvents();
    };
    
    Kanbam.prototype.hideEditTask = function() {
        $(".detail").fadeOut("fast");
    };
    
    Kanbam.prototype.movePositionPopover = function( id ) {
        var pop = $(".detail");
        var post = $("#post" + id);
        var stories = $(".stories");
        var posXPop, posYPop = 0;
        var headHeight = $(".head").height() + $(".project").height();
        
        if ( $(window).width() - ( post.offset().left + post.width() ) > pop.width() ) {
            posXPop = post.offset().left + post.width() + 10;
            pop.removeClass("left");
            pop.addClass("right");
        } else {
            posXPop = post.offset().left - pop.width() - 10;
            pop.removeClass("right");
            pop.addClass("left");
        }
        
        posYPop = post.offset().top - ( pop.height() / 2 ) + ( post.height() / 2 );
        
        if ( posYPop < headHeight ) {
            posYPop = headHeight + 5;
        }
        
        if ( posYPop > $(document).height() - pop.height() - 60 - 10 ) {
            posYPop = $(document).height() - pop.height() - 60 - 10;
        }
        
        pop.offset({ 
            top : posYPop,
            left : posXPop
        });
        
        $(".detail .arrow").offset({
            top : post.offset().top + ( post.height() / 2 ) - 10
        });
        
        $('html, body').animate({ scrollTop: pop.offset().top - headHeight - 10 }, 300);
    };
    
    Kanbam.prototype.updateTaskDetail = function( id ) {
        var self = this;
        if ( $(".detail-task-name").val().trim() === "" ) {
            $(".detail-task-name").parent().parent().addClass("error");
            return false;
        } else {
            $(".detail-task-name").parent().parent().removeClass("error");
        }
        
        if ( 
            ( isNaN( $(".detail-estimated").val()) ) ||
            ( parseFloat($(".detail-estimated").val() ) < 0 ) 
        ) {
            $(".detail-estimated").parent().parent().addClass("error");
            
            return false;
        } else {
            $(".detail-estimated").parent().parent().removeClass("error");
        }
        
        $(".detail").slideUp("fast");
        
        if ( $(".detail-impediment").is(':checked') ) {
            this.$scope.tool.changeStatusTask({
                id : id,
                status : "IMPEDIMENT",
                story : this.$scope.editTask.story_id
            });
        } else {
            this.$scope.tool.changeStatusTask({
                id : id,
                status : this.$scope.editTask.status_name,
                story : this.$scope.editTask.story_id
            });
        }
        
        this.$scope.tool.updateTask({
            id : id, 
            name : $(".detail-task-name").val(), 
            estimated : Number( $(".detail-estimated").val() ),
            assigned_to_id : self.$scope.editTask.assigned_to_id, 
            assigned_to_name : self.$scope.editTask.assigned_to_name 
        });
    };
    
    Kanbam.prototype.search = function( keyword ) {
        if ( keyword.substring(0, 1) == "#" ) {
            var id = keyword.substring(1, keyword.length);
            
            if ( $("#post" + id).attr("id") !== undefined ) {
                var headHeight = $(".head").height() + $(".project").height();
            
                $(".post-it").hide();
                $("#post" + id).show();
                
                
                this.hideEditTask();
                this.showEditTask( id );
                
                $(".search-value").select();
                
                $('html, body').animate({ scrollTop: $(".detail").offset().top - headHeight - 10 }, 300);
            }
        } else {
            this.hideEditTask();
            
            for ( var i = 0; i < this.$scope.tasks.length; i++ ) {
                if ( this.$scope.tasks[ i ].name.toLowerCase().indexOf( keyword.toLowerCase() ) < 0 ) {
                    $("#post" + this.$scope.tasks[ i ].id).hide();
                } else {
                    $("#post" + this.$scope.tasks[ i ].id).show();
                }
            }
        }
    };
    
    Kanbam.prototype.onUpdateData = function() {
        this.$scope.$apply();
    };
    
    Kanbam.prototype.showError = function(message) {
        $(".alert").fadeIn("fast").delay(3000).fadeOut("fast");
        $(".alert-message").html( message );
    };
    
    Kanbam.prototype.getCookiesSettings = function() {
        this.$scope.settings.apiKey     = $.cookie("apiKey");
        this.$scope.settings.redmineURI = $.cookie("redmineURI");
        this.$scope.settings.tool       = $.cookie("tool");
        
        this.$scope.currentProject = { id : $.cookie("lastProjectId"), name : $.cookie("lastProjectName") };
    };
    
    Kanbam.prototype.getActivityColorById = function(id) {
        for (i = 0; i < this.$scope.activities.length; i++) {
            if (this.$scope.activities[ i ].id == id) {
                return this.$scope.colors[ i ];
            }
        }
    };
    
    Kanbam.prototype.formatDate = function(date) {
        if ( date === "" ) {
            return "";
        } else {
            return date.split("/")[2] + "-" + date.split("/")[0] + "-" + date.split("/")[1];
        }
    };
    
    Kanbam.prototype.fixStoryCell = function() {
        var w = ( Math.round( ( $(window).width() - $(".stories-column").width() ) / 3 ) + 2 );
        $(".tasks-column").attr("style", "min-width: " + w + " !important; width:" + w + "px !important" );
    };
    
    Kanbam.prototype.fixStoryHeight = function() {
        if ( ( $(".stories-table").height() + $(".project").height() + $(".footer").height() ) < $(window).height() ) {
            $(".stories-table").height( $(window).height() - $(".project").height() - $(".footer").height() + 9 );
        }
    };
    
    Kanbam.prototype.isPresentationMode = function() {
        if ( this.$scope.settings.viewMode == "Presentation mode" ) {
            return true;
        } else {
            return false;
        }
    };

    Kanbam.prototype.togglePresentationAction = function() {
        if ( this.isPlaying === true ) {
            this.$scope.presentation.pause();
            $(".project-action i").removeClass("icon-pause");
            $(".project-action i").addClass("icon-play");
        } else {
            this.$scope.presentation.play();
            $(".project-action i").removeClass("icon-play");
            $(".project-action i").addClass("icon-pause");
        }
        this.isPlaying = !this.isPlaying;
    };
});
