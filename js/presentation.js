/*!
* Kanb.am by @marloscarmo
* Author: Marlos Carmo
* http://www.apache.org/licenses/LICENSE-2.0.txt
*/

define(['jquery', 'exports', 'plugins', 'localData'], function($, exports, plugins, localData){
    var self;

    exports.init = function($scope) {
        $scope.presentation = new Presentation($scope);
        $scope.presentation.start();
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
        var projects = $.cookie("presentationProjects").split(",");

        if (projects != undefined ) {
            for ( var i = 0; i < projects.length; i++ ) {
                $("#project" + projects[ i ]).attr("checked", true);    
            }
        }
    }

    Presentation.prototype.saveProjects = function() {
        var self = this;
        this.selectedProjects = []; 

        $(".footer").hide();

        $(".settings-list-projects input:checkbox:checked").each( function() {
            self.selectedProjects.push( $(this).val() );
        });

        $.cookie("presentationProjects", this.selectedProjects.toString());
    }
    
    Presentation.prototype.play = function() {
        var self = this;
        
        this.gotoProject( this.selectedProjects[ this.currentProject ] );

        setInterval( function() {
            self.nextProject();    
        }, 30000);
    }
    
    Presentation.prototype.pause = function() {
        
    }
    
    Presentation.prototype.nextProject = function() {
        this.currentProject++;

        if ( this.currentProject >= this.selectedProjects.length ) {
            this.currentProject = 0;
        }
        this.gotoProject( this.selectedProjects[ this.currentProject ] );
    }
    
    Presentation.prototype.gotoProject = function( id ) {
        console.log(id);
        
        $(".loading").fadeIn("fast");
        this.$scope.tool.changeProject( id );
    }
});
