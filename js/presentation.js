/*!
* Kanb.am by @marloscarmo
* Author: Marlos Carmo
* http://www.apache.org/licenses/LICENSE-2.0.txt
*/

define(['jquery', 'exports', 'plugins'], function($, exports, plugins){
    var self;

    exports.init = function($scope) {
        $scope.presentation = new Presentation($scope);
        $scope.presentation.start();
        $scope.presentation.intervalTime = 120000;
        self = $scope.presentation;
    }
    
    var Presentation = function($scope) {
        this.$scope = $scope;
        this.self = this;
        this.currentProject = 0;
        
        this.selectedProjects = [];
    }
    
    Presentation.prototype.start = function() {
    }

    Presentation.prototype.getSavedProjects = function() {
        if ( $.cookie("presentationProjects") != "") {
            if ( $.cookie("presentationProjects") != undefined ) {
                var projects = $.cookie("presentationProjects").split(",");

                this.selectedProjects = projects;

                if (projects != undefined ) {
                    for ( var i = 0; i < projects.length; i++ ) {
                        $("#project" + projects[ i ]).attr("checked", true);    
                    }
                }
            }
        }
    }

    Presentation.prototype.saveProjects = function() {
        var self = this;
        self.selectedProjects = [];

        $(".settings-list-projects input:checkbox:checked").each( function() {
            self.selectedProjects.push( $(this).val() );
        });

        $.cookie("presentationProjects", self.selectedProjects.toString());
    }
    
    Presentation.prototype.play = function() {
        var self = this;
        
        $("body").stop();
        $("body").scrollTop(0);
        $("body").delay(2000).animate({ 
            scrollTop : $("html").height() - $(window).height() 
        }, 
        { 
            duration : self.$scope.presentation.intervalTime, 
            complete : self.nextProject,
            easing : "linear"
        });
    }
    
    Presentation.prototype.pause = function() {
        $(window).scrollTop(0);
        $("body").stop();    
    }
    
    Presentation.prototype.nextProject = function() {
        self.currentProject++;
        
        if (self.currentProject >= self.selectedProjects.length ) {
            self.currentProject = 0;
        }
        self.gotoProject( self.selectedProjects[ self.currentProject ] );
    }
    
    Presentation.prototype.gotoProject = function( id ) {
        $(".loading").show();
        this.$scope.tool.changeProject( id );
    }
});
