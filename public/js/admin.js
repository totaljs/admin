ON('location', function() {
	$('.mainmenu').rclass('mainmenu-visible');
});

$(window).on('message', function(e) {
	var data = PARSE((e.originalEvent && e.originalEvent.data).toString() || '');
	if (!data)
		return;
	switch (data.type) {
		case 'progress':
			SET('common.progress', data.value || 0);
			break;
		case 'activity':
			if (common.showapps)
				SET('common.showapps', false);
			common.lastactivity = Date.now();
			if (common.shownotifications)
				SET('common.shownotifications', false);
			break;
		case 'reload':
			location.reload(true);
			break;
		case 'warning':

			if (data.body instanceof Array) {
				// maybe a bug
				var msg = [];
				for (var i = 0; i < data.body.length; i++)
					msg.push(data.body[i].error);
				data.body = msg.join('<br />');
			}

			SETTER('message', 'warning', data.body);
			break;
		case 'success':
			SETTER('snackbar', 'success', data.body);
			break;
		case 'loading':
			SETTER('loading', data.show == null ? 'toggle' : data.show ? 'show' : 'hide', data.delay);
			break;
		case 'confirm':
			SETTER('confirm', 'show', data.body, data.buttons, function(index) {
				SETTER('iframe', 'callback', data.callbackid, [index]);
			});
			break;
		case 'init':
			var data = CLONE(user);
			data.roles = data.plugins[common.id] || EMPTYARRAY;
			SETTER('iframe', 'send', { type: 'init', body: data });
			break;
	}
});

FUNC.send = function(opt, callback) {

	if (typeof(opt) === 'string')
		opt = { plugin: opt };

	// opt.plugin
	// opt.id
	// opt.params
	// opt.data
	// opt.query

	var query = opt.query ? $.param(opt.query) : '';
	delete opt.query;

	AJAX('POST @{#}/admin/' + (query ? ('?' + query) : ''), opt, callback);
};