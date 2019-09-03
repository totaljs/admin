const Fs = require('fs');

// List of all plugins
MAIN.plugins = [];

FUNC.notify = function(plugin, userid, message, data) {

	if (!userid)
		return;

	plugin = MAIN.plugins.findItem('id', plugin);

	if (plugin == null)
		return;

	var obj = {};
	obj.plugin = plugin;
	obj.icon = plugin.icon;
	obj.name = plugin.name;
	obj.userid = userid;
	obj.message = message;
	obj.data = data;
	obj.dtcreated = NOW;

	NOSQL('users').modify({ '+notifications': 1 }).where('id', userid);
	NOSQL('notifications').insert(obj);

	// Updates all user sessions
	MAIN.sessions.list(model.userid, function(err, sessions) {
		for (var i = 0; i < sessions.length; i++) {
			var session = sessions[i];

			// Optimized for single-thread only
			if (session.data)
				session.data.notifications++;
		}
	});
};

FUNC.refreshplugins = function(callback) {
	Fs.readdir(PATH.root('plugins'), function(err, response) {

		if (response == null) {
			callback && callback();
			return;
		}

		response.wait(function(plugin, next) {

			var obj = REQUIRE('plugins/{0}/index.js'.format(plugin));
			obj.id = plugin;
			obj.install && obj.install();
			obj.permissions = {};
			var is = false;

			var keys = Object.keys(obj.actions);
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				var route = obj.actions[key];
				obj.actions[key] = route.replace(/\{.*?\}/g, function(text) {
					text = text.trim();
					var arr = text.substring(1, text.length - 1).split(',').trim();
					for (var j = 0; j < arr.length; j++) {
						if (!obj.permissions[key])
							obj.permissions[key] = {};
						obj.permissions[key][arr[j]] = 1;
						is = true;
					}
					return '';
				}).trim();
			}

			if (!is)
				delete obj.permissions;

			MAIN.plugins.push(obj);
			next();
		}, callback);

	});
};

ON('ready', function() {
	FUNC.refreshplugins();
	PREF.smtp && Mail.use(PREF.smtp, PREF.smtpsettings.parseJSON());
});