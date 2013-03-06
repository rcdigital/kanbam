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
        self = $scope.presentation;
    }

    var Presentation = function($scope) {
        this.$scope = $scope;
        this.self = this;
        this.currentProject = 0;
        this.countInterval = 0;
        this.isInterval = false;
        this.functionInterval = 0;

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
        self.countInterval = 0;

        $(".settings-list-projects input:checkbox:checked").each( function() {
            self.selectedProjects.push( $(this).val() );
        });

        $.cookie("presentationProjects", self.selectedProjects.toString());
    }

    Presentation.prototype.play = function() {
        self.isInterval = true;

        clearInterval(self.functionInterval);
        
        setTimeout( function() {
            self.functionInterval = setInterval( function() {
                self.countInterval += 1;

                $("body").scrollTop( self.countInterval );

                var scrollPosition = $("body").scrollTop();
                var scrollHeight = $("html").height() - $(window).height();

                if ( scrollPosition == scrollHeight ) {
                    clearInterval(self.functionInterval); 
                    setTimeout( function() {
                        self.nextProject();
                    }, 3000 );
                }
            }, 50 );
        }, 3000 );
    }
    
    Presentation.prototype.pause = function() {
        clearInterval(self.functionInterval);
    }
    
    Presentation.prototype.nextProject = function() {
        self.currentProject++;
        self.countInterval = 0;

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
