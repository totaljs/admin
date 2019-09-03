exports.install = function() {
	ROUTE('-GET   /admin/', 'admin-login');
	ROUTE('+GET   /admin/', 'admin');
	ROUTE('+GET   /admin/logout/', account_logout);
	ROUTE('+GET   /admin/me/', account_me);
	ROUTE('+POST  /admin/', processdata_auth);
	ROUTE('-POST  /admin/', processdata);
	FILE(pluginfiles);
};

function pluginfiles(req, res, is) {

	if (is)
		return req.url[1] === '_';

	var path = req.uri.pathname;
	var index = path.indexOf('/', 2);
	var name = path.substring(2, index);

	for (var i = 0; i < MAIN.plugins.length; i++) {
		var plugin = MAIN.plugins[i];
		if (plugin.id === name) {
			var file = path.substring(index + 1);
			var filename = 'plugins/' + name + '/public/' + file;
			res.file(filename);
			return;
		}
	}

	res.throw404();
}

function processdata_auth() {

	// body.plugin {String} in the form "plugin/action"
	// body.id {String} optional
	// body.data {Object} optional
	// body.params {Object} optional

	var self = this;
	var body = self.body;
	var meta = (body.plugin + '').split('/');

	if (meta.length !== 2) {
		self.invalid('error-invalid');
		return;
	}

	var plugin = MAIN.plugins.findItem('id', meta[0]);

	if (!plugin) {
		self.invalid('error-plugins-404');
		return;
	}

	var action = plugin.actions[meta[1]];
	if (!action) {
		self.invalid('error-actions-404');
		return;
	}

	if (action.permissions && action.permissions[meta[1]]) {

		var roles = self.users.plugins[meta[0]];
		if (!roles.length) {
			self.invalid('error-permissions');
			return;
		}

		var permissions = action.permissions[meta[1]];
		var is = false;

		for (var i = 0; i < roles.length; i++) {
			if (permissions[roles[i]]) {
				is = true;
				break;
			}
		}

		if (!is) {
			self.invalid('error-permissions');
			return;
		}
	}

	// Internal Total.js hack
	self.params = body.params || EMPTYOBJECT;
	self.query = self.query;
	self.id = body.id || '';

	// Evaluates action
	$ACTION(action, body.data, self.callback(), self);
}

function processdata() {

	// body.plugin {String} in the form "plugin/action"
	// body.id {String} optional
	// body.data {Object} optional
	// body.params {Object} optional

	var self = this;
	var body = self.body;
	var action;

	switch (body.plugin) {
		case 'login':
			action = 'POST Users/Login --> @exec';
			break;
		case 'password':
			action = 'POST Users/Password --> @exec';
			break;
		case 'otp':
			action = 'POST Users/Login --> @otp';
			break;
		default:
			self.status = 401;
			self.invalid('error-permissions');
			return;
	}

	// Evaluates action
	$ACTION(action, body.data, self.callback(), self);
}

function account_me() {
	var self = this;
	self.json(self.user);
}

function account_logout() {
	var self = this;
	MAIN.session.remove(self.sessionid);
	self.cookie(PREF.cookie || 'admin', '', '-1 day');
	self.redirect('/');
}