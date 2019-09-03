window.ADMIN = {};

ADMIN.version = 1.0;
ADMIN.lastactivity = 0;
ADMIN.client = location.href;
ADMIN.callbacks = {};

ADMIN.send = function(opt, callback) {

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

ON('response', function(response) {
	if (response.status === 401) {
		// Reload
		response.cancel = true;
		ADMIN.$notify({ type: 'reload' });
	}
});

ADMIN.upload = function(opt) {
	// not implemented yet
};

(function() {

	var cls = 'layout-show';
	var is;
	var x;

	var show = function(el, type) {
		el.aclass(cls + '-' + type);
		setTimeout(function() {
			el.aclass(cls + '-' + type + '-animate');
		}, 50);
	};

	var hide = function(el, type) {
		el.rclass(cls + '-' + type + '-animate');
		setTimeout(function() {
			el.rclass(cls + '-' + type);
		}, 150);
	};

	$(document.body).on('touchstart touchmove', function(e) {

		if (is)
			return;

		var t = e.touches[0];
		var stop = false;

		if (e.type === 'touchstart')
			x = t.pageX;
		else if (e.type !== 'touchmove')
			return false;

		if ((x >= 0 && x < 50) && (t.pageX - x) > 80) {

			var b = $(document.body);
			var main = b.find('main');

			if (main.hclass('layout3')) {
				if (b.hclass(cls + '-right'))
					hide(b, 'right');
				else
					show(b, 'left');
				stop = true;
			} else if (main.hclass('layout2')) {
				if (b.hclass(cls + '-right'))
					hide(b, 'right');
				else if (b.hclass(cls + '-left'))
					hide(b, 'left');
				else
					show(b, 'left');
				stop = true;
			}

		} else if ((x >= WW - 50) && (x - t.pageX) > 50) {

			is = setTimeout(function() {
				is = null;
			}, 500);

			var b = $(document.body);
			var main = b.find('main');

			if (main.hclass('layout3')) {
				if (b.hclass(cls + '-left'))
					hide(b, 'left');
				else
					show(b, 'right');
				stop = true;
			} else if (main.hclass('layout2')) {
				stop = true;
				if (b.hclass(cls + '-left'))
					hide(b, 'left');
			}
		}

		if (stop) {
			is = setTimeout(function() {
				is = null;
			}, 500);
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	});
})();

// Reload
$(window).on('keydown', function(e) {

	if (e.keyCode === 116) {
		location.href = ADMIN.client;
		e.preventDefault();
		e.stopPropagation();
	} else if (e.keyCode === 112) {
		ADMIN.$notify({ type: 'F1' });
		e.preventDefault();
		e.stopPropagation();
	}

	var now = Date.now();
	if ((now - ADMIN.lastactivity) > 5000) {
		ADMIN.lastactivity = now;
		ADMIN.$notify({ type: 'activity' });
	}

}).on('click touchstart', function() {
	var now = Date.now();
	if ((now - ADMIN.lastactivity) > 2000) {
		ADMIN.lastactivity = now;
		ADMIN.$notify({ type: 'activity' });
	}
}).on('resize', ADMIN.resize).on('message', function(e) {
	var data = PARSE((e.originalEvent && e.originalEvent.data).toString() || '');
	if (data) {
		if (data.callbackid)
			ADMIN.callbacks[data.callbackid].apply(W, data.body);
		else if (data.type === 'init') {
			SET('user', data.body);
			$(document.body).rclass('invisible');
			window.INIT && window.INIT(data.body);
		} else if (data.type === 'user')
			SET('user', data.body);
	}
});

ADMIN.resize = function() {
	$('main > section').css('min-height', WH);
};

ADMIN.confirm = function(msg, buttons, callback) {
	ADMIN.$notify({ type: 'confirm', body: msg, buttons: buttons }, callback);
};

ADMIN.message = function(msg, type) {
	ADMIN.$notify({ type: type || 'success', body: msg });
};

ADMIN.success = function(msg, callback) {
	if (typeof(msg) === 'function') {
		callback = msg;
		msg = null;
	}
	return function(response, err) {
		if (response.success) {
			msg && ADMIN.$notify({ type: 'success', body: msg });
			callback && callback(response, err);
		} else
			ADMIN.$notify({ type: 'warning', body: response instanceof Array ? response[0].error : (response + '') });
	};
};

ADMIN.hidemenu = function() {
	var b = $(document.body);
	b.rclass('layout-show-left-animate layout-show-right-animate');
	setTimeout(function() {
		b.rclass('layout-show-left layout-show-right');
	}, 150);
};

ADMIN.showmenu = function(type) {

	if (!type)
		type = 'left';

	var b = $(document.body);
	var op = type === 'left' ? 'right' : 'left';
	b.rclass('layout-show-{0} layout-show-{0}-animate'.format(op)).aclass('layout-show-' + type);
	setTimeout(function() {
		b.aclass('layout-show-{0}-animate'.format(type));
	}, 150);
};

ADMIN.$notify = function(data, callback) {

	if (callback) {
		data.callbackid = GUID(10);
		ADMIN.callbacks[data.callbackid] = callback;
	}

	data.version = 1;
	top.postMessage(JSON.stringify(data), '*');
};

ADMIN.loading = function(show, delay) {
	ADMIN.$notify({ type: 'loading', show: show, delay: delay });
};

ADMIN.progress = function(val) {
	ADMIN.$notify({ type: 'progress', value: val });
};

ADMIN.resize();
ADMIN.$notify({ type: 'init' });