var OTP = {};
var OTPCOUNT = 0;

NEWSCHEMA('Users/Login', function(schema) {

	schema.define('email', 'Email', true);
	schema.define('password', 'String(30)', true);

	schema.addWorkflow('exec', function($) {

		var model = $.clean();
		model.password = model.password.sha256();

		NOSQL('users').read().rule((doc, model) => doc.email === model.email && doc.password == model.password, model).fields('id,isblocked,istwofactor,secret').callback(function(err, response) {
			if (response) {

				if (response.isblocked) {
					$.invalid('errors-account-blocked');
					return;
				}

				if (response.istwofactor) {
					OTP[model.email] = { date: NOW.add('2 minutes'), id: response.id, secret: response.secret, count: 0 };
					OTPCOUNT++;
					$.success(true, 'otp');
					return;
				}

				var opt = {};
				opt.sessionid = UID();
				opt.key = PREF.cookie_key;
				opt.name = PREF.cookie;
				opt.expire = PREF.cookie_expiration;
				opt.id = response.id;
				opt.note = ($.headers['user-agent'] || '').parseUA() + ' (' + $.ip + ')';
				MAIN.session.setcookie($.controller, opt, $.done());

			} else
				$.invalid('error-credentials');
		});
	});

	schema.addWorkflow('otp', function($) {

		var id = $.model.email;
		var session = OTP[id];
		if (session == null) {
			$.invalid('error-otp-session');
			return;
		}

		if (session.count++ > 3 || session.date < NOW) {
			OTPCOUNT--;
			delete OTP[id];
			$.invalid('error-otp-session');
			return;
		}

		var output = MODULE('totp').totpverify(session.secret, $.model.password);
		if (output && output.delta < 3) {

			OTPCOUNT--;
			delete OTP[id];

			var opt = {};
			opt.sessionid = UID();
			opt.key = PREF.cookie_key;
			opt.name = PREF.cookie;
			opt.expire = PREF.cookie_expiration;
			opt.id = session.id;
			opt.note = ($.headers['user-agent'] || '').parseUA() + ' (' + $.ip + ')';
			MAIN.session.setcookie($.controller, opt, $.done());
		} else
			$.invalid('error-otp-code');

	});

});