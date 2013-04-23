/*!
* Kanb.am by @marloscarmo
* Author: Marlos Carmo
* http://www.apache.org/licenses/LICENSE-2.0.txt
*/

define(['jquery', 'exports', 'redmine'], function($, exports, redmine){

    exports.init = function($scope, kanbam) {
        this.scope = $scope;
        this.kanbam = kanbam;
    };

    exports.start = function() {
        if (this.scope.settings.tool == "redmine") {
            this.scope.tool = redmine;
        }
        this.scope.tool.init(this.scope, this.kanbam);
    };

});
