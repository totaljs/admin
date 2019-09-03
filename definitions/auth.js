MAIN.session = SESSION();

MAIN.session.ondata = function(meta, next) {
	NOSQL('users').read().rule((doc, id) => !doc.isblocked && doc.id === id, meta.id).fields('id,name,plugins,sa').callback(function(err, response) {
		if (response) {

			var arr = response.name.split(' ');
			response.initials = (arr[0][0] + (arr[1] ? arr[1][0] : '')).toUpperCase();
			response.inventory = [];

			for (var i = 0; i < MAIN.plugins.length; i++) {
				var plugin = MAIN.plugins[i];
				var roles = response.plugins[plugin.id];
				if (roles)
					response.inventory.push({ id: plugin.id, name: plugin.name, roles: roles, icon: plugin.icon, color: plugin.color, version: plugin.version });
			}

			next(null, response);
		} else
			next('error-account');
	});
};

function auth(err, response, meta, init, $) {

	if (init && response) {
		$.user = response;
		AUDIT('audit', $, 'login', 'Session initialization');
	}

	if (response)
		$.success(response);
	else
		$.invalid();
}

AUTH(function($) {
	var opt = {};
	opt.name = PREF.cookie || 'admin';
	opt.key = PREF.cookie_key || 'auth';
	opt.expire = PREF.cookie_expiration || '3 days';
	opt.ddos = 5;
	MAIN.session.getcookie($, opt, auth, $);
});