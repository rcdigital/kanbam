require.config({ 
	paths: { 
		jquery: 'lib/jquery-1.9.0.min',
		jqueryui: 'lib/jquery-ui-1.10.0.custom.min',
		bootstrap: 'lib/bootstrap.min',
		underscore: 'lib/underscore-min',
		plugins: 'lib/plugins'
	},
	shim: {
        'bootstrap': ['jquery'],
        'plugins': ['jquery']
    }
});

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
