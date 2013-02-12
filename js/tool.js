/*!
* Kanb.am by @marloscarmo
* Author: Marlos Carmo
* http://www.apache.org/licenses/LICENSE-2.0.txt
*/

define(['jquery', 'exports', 'redmine'], function($, exports, redmine){
    var self = this;

    exports.init = function($scope, kanbam) {
        self.$scope = $scope;
        self.kanbam = kanbam;
    }
    
    this.start = function() {
        if (self.$scope.settings.tool == "redmine") {
            self.$scope.tool = redmine;
        }
        
        self.$scope.tool.init(self.$scope, self.kanbam);
    }

});