require.config({ 
	paths: { 
		jquery: '//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min',
		jqueryui: '//ajax.googleapis.com/ajax/libs/jqueryui/1.9.0/jquery-ui.min',
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
