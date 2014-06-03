/*!
* Kanb.am by @marloscarmo
* Author: Marlos Carmo
* http://www.apache.org/licenses/LICENSE-2.0.txt
*/
'use strict';
require.config({
	paths: {
		jquery: 'lib/jquery-1.11.1.min',
		jqueryui: 'lib/jquery-ui-1.10.0.custom.min',
		bootstrap: 'lib/bootstrap.min',
		underscore: 'lib/underscore-min',
		datepicker: 'lib/bootstrap-datepicker',
		plugins: 'plugins',
		presentation: 'presentation'
	},
	shim: {
	    'jquery': {
	        exports: 'jQuery'
	    },
        'bootstrap': {
            deps: ['jquery']
        },
        'plugins':{deps: ['jquery']}
    },
    waitSeconds: 5000
});

if (typeof jQuery === 'function') {
  define('jquery', function() { return jQuery; });
}

define(['jquery', 'kanbam'], function ($, kanbam) {

	function onReadyToStart($scope){
		$(document).ready(function() {
    		kanbam.init($scope);
		});
	}

	return {
		onReadyToStart: onReadyToStart
	};

});

function App($scope) {
    require(['main'], function(main){
        main.onReadyToStart($scope);
    });
}
