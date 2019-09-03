COMPONENT('iframe', function(self) {

	var iframe;

	self.make = function() {
		self.aclass('ui-iframe');
		self.append('<iframe src="about:blank" frameborder="0" scrolling="no" allowtransparency="true" allow="geolocation *; microphone *; camera *; midi *; encrypted-media *"></iframe>');
		iframe = self.find('iframe');
		$(W).on('resize', self.resize2);
		self.resize2();
	};

	self.resize2 = function() {
		setTimeout2(self.ID, self.resize, 300);
	};

	self.resize = function() {
		iframe.css({ width: WW, height: WH - self.element.offset().top });
	};

	self.setter = function(value) {
		iframe.attr('src', value || 'about:blank');
	};

	self.callback = function(callbackid, body) {
		var data = {};
		data.callbackid = callbackid;
		data.body = body;
		self.send(data);
	};

	self.send = function(data) {
		iframe[0].contentWindow.postMessage(JSON.stringify(data), '*');
	};
});

COMPONENT('exec', function(self, config) {
	self.readonly();
	self.blind();
	self.make = function() {

		var scope = null;

		var scopepath = function(el, val) {
			if (!scope)
				scope = el.scope();
			return scope ? scope.makepath ? scope.makepath(val) : val.replace(/\?/g, el.scope().path) : val;
		};

		var fn = function(plus) {
			return function(e) {

				var el = $(this);
				var attr = el.attrd('exec' + plus);
				var path = el.attrd('path' + plus);
				var href = el.attrd('href' + plus);
				var def = el.attrd('def' + plus);
				var reset = el.attrd('reset' + plus);

				scope = null;

				if (el.attrd('prevent' + plus) === 'true') {
					e.preventDefault();
					e.stopPropagation();
				}

				if (attr) {
					if (attr.indexOf('?') !== -1)
						attr = scopepath(el, attr);
					EXEC(attr, el, e);
				}

				href && NAV.redirect(href);

				if (def) {
					if (def.indexOf('?') !== -1)
						def = scopepath(el, def);
					DEFAULT(def);
				}

				if (reset) {
					if (reset.indexOf('?') !== -1)
						reset = scopepath(el, reset);
					RESET(reset);
				}

				if (path) {
					var val = el.attrd('value');
					if (val) {
						if (path.indexOf('?') !== -1)
							path = scopepath(el, path);
						var v = GET(path);
						SET(path, new Function('value', 'return ' + val)(v), true);
					}
				}
			};
		};

		self.event('dblclick', config.selector2 || '.exec2', fn('2'));
		self.event('click', config.selector || '.exec', fn(''));
	};
});

COMPONENT('shortcuts', function(self) {

	var items = [];
	var length = 0;

	self.singleton();
	self.readonly();
	self.blind();
	self.nocompile && self.nocompile();

	self.make = function() {
		$(window).on('keydown', function(e) {
			if (length && !e.isPropagationStopped()) {
				for (var i = 0; i < length; i++) {
					var o = items[i];
					if (o.fn(e)) {
						if (o.prevent) {
							e.preventDefault();
							e.stopPropagation();
						}
						setTimeout(function(o, e) {
							o.callback(e);
						}, 100, o, e);
					}
				}
			}
		});
	};

	self.exec = function(shortcut) {
		var item = items.findItem('shortcut', shortcut.toLowerCase().replace(/\s/g, ''));
		item && item.callback(EMPTYOBJECT);
	};

	self.register = function(shortcut, callback, prevent) {
		shortcut.split(',').trim().forEach(function(shortcut) {
			var builder = [];
			var alias = [];
			shortcut.split('+').trim().forEach(function(item) {
				var lower = item.toLowerCase();
				alias.push(lower);
				switch (lower) {
					case 'ctrl':
					case 'alt':
					case 'shift':
						builder.push('e.{0}Key'.format(lower));
						return;
					case 'win':
					case 'meta':
					case 'cmd':
						builder.push('e.metaKey');
						return;
					case 'ins':
						builder.push('e.keyCode===45');
						return;
					case 'space':
						builder.push('e.keyCode===32');
						return;
					case 'tab':
						builder.push('e.keyCode===9');
						return;
					case 'esc':
						builder.push('e.keyCode===27');
						return;
					case 'enter':
						builder.push('e.keyCode===13');
						return;
					case 'backspace':
					case 'del':
					case 'delete':
						builder.push('(e.keyCode===8||e.keyCode===127)');
						return;
					case 'up':
						builder.push('e.keyCode===38');
						return;
					case 'down':
						builder.push('e.keyCode===40');
						return;
					case 'right':
						builder.push('e.keyCode===39');
						return;
					case 'left':
						builder.push('e.keyCode===37');
						return;
					case 'f1':
					case 'f2':
					case 'f3':
					case 'f4':
					case 'f5':
					case 'f6':
					case 'f7':
					case 'f8':
					case 'f9':
					case 'f10':
					case 'f11':
					case 'f12':
						var a = item.toUpperCase();
						builder.push('e.key===\'{0}\''.format(a));
						return;
					case 'capslock':
						builder.push('e.which===20');
						return;
				}

				var num = item.parseInt();
				if (num)
					builder.push('e.which===' + num);
				else
					builder.push('e.keyCode==={0}'.format(item.toUpperCase().charCodeAt(0)));
			});

			items.push({ shortcut: alias.join('+'), fn: new Function('e', 'return ' + builder.join('&&')), callback: callback, prevent: prevent });
			length = items.length;
		});
		return self;
	};
});

COMPONENT('message', function(self, config) {

	var cls = 'ui-message';
	var cls2 = '.' + cls;
	var is, visible = false;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass(cls + ' hidden');

		self.event('click', 'button', function() {
			self.hide();
		});

		$(window).on('keyup', function(e) {
			visible && e.which === 27 && self.hide();
		});
	};

	self.warning = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content(cls + '-warning', message, icon || 'warning');
	};

	self.info = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content(cls + '-info', message, icon || 'info-circle');
	};

	self.success = function(message, icon, fn) {

		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}

		self.callback = fn;
		self.content(cls + '-success', message, icon || 'check-circle');
	};

	FUNC.messageresponse = function(success, callback) {
		return function(response, err) {
			if (err || response instanceof Array) {

				var msg = [];
				var template = '<div class="' + cls + '-error"><i class="fa fa-warning"></i>{0}</div>';

				if (response instanceof Array) {
					for (var i = 0; i < response.length; i++)
						msg.push(template.format(response[i].error));
					msg = msg.join('');
				} else
					msg = template.format(err.toString());

				self.warning(msg);
			} else {
				self.success(success);
				callback && callback(response);
			}
		};
	};

	self.hide = function() {
		self.callback && self.callback();
		self.aclass('hidden');
		visible = false;
	};

	self.content = function(classname, text, icon) {
		!is && self.html('<div><div class="ui-message-icon"><i class="fa fa-' + icon + '"></i></div><div class="ui-message-body"><div class="text"></div><hr /><button>' + (config.button || 'OK') + '</button></div></div>');
		visible = true;
		self.rclass2(cls + '-').aclass(classname);
		self.find(cls2 + '-body').rclass().aclass(cls + '-body');

		if (is)
			self.find(cls2 + '-icon').find('.fa').rclass2('fa-').aclass('fa-' + icon);

		self.find('.text').html(text);
		self.rclass('hidden');
		is = true;
		setTimeout(function() {
			self.aclass(cls + '-visible');
			setTimeout(function() {
				self.find(cls2 + '-icon').aclass(cls + '-icon-animate');
			}, 300);
		}, 100);
	};
});

COMPONENT('snackbar', 'timeout:4000;button:OK', function(self, config) {

	var cls = 'ui-snackbar';
	var cls2 = '.' + cls;
	var show = true;
	var callback;
	var delay;

	self.readonly();
	self.blind();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass(cls + ' hidden');
		self.append('<div><span class="{0}-dismiss"></span><span class="{0}-icon"></span><div class="{0}-body"></div></div>'.format(cls));
		self.event('click', cls2 + '-dismiss', function() {
			self.hide();
			callback && callback();
		});
	};

	self.hide = function() {
		clearTimeout2(self.ID);
		self.rclass(cls + '-visible');
		if (delay) {
			clearTimeout(delay);
			self.aclass('hidden');
			delay = null;
		} else {
			delay = setTimeout(function() {
				delay = null;
				self.aclass('hidden');
			}, 1000);
		}
		show = true;
	};

	self.waiting = function(message, button, close) {
		self.show(message, button, close, 'fa-spinner fa-pulse');
	};

	self.success = function(message, button, close) {
		self.show(message, button, close, 'fa-check-circle');
	};

	self.warning = function(message, button, close) {
		self.show(message, button, close, 'fa-times-circle');
	};

	self.show = function(message, button, close, icon) {

		if (typeof(button) === 'function') {
			close = button;
			button = null;
		}

		callback = close;

		self.find(cls2 + '-icon').html('<i class="fa {0}"></i>'.format(icon || 'fa-info-circle'));
		self.find(cls2 + '-body').html(message).attr('title', message);
		self.find(cls2 + '-dismiss').html(button || config.button);

		if (show) {
			self.rclass('hidden');
			setTimeout(function() {
				self.aclass(cls + '-visible');
			}, 50);
		}

		setTimeout2(self.ID, self.hide, config.timeout + 50);
		show = false;
	};
});

COMPONENT('confirm', function(self) {

	var is, visible = false;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {

		self.aclass('ui-confirm hidden');

		self.event('click', 'button', function() {
			self.hide($(this).attrd('index').parseInt());
		});

		self.event('click', function(e) {
			var t = e.target.tagName;
			if (t !== 'DIV')
				return;
			var el = self.find('.ui-confirm-body');
			el.aclass('ui-confirm-click');
			setTimeout(function() {
				el.rclass('ui-confirm-click');
			}, 300);
		});

		$(window).on('keydown', function(e) {
			if (!visible)
				return;
			var index = e.which === 13 ? 0 : e.which === 27 ? 1 : null;
			if (index != null) {
				self.find('button[data-index="{0}"]'.format(index)).trigger('click');
				e.preventDefault();
				e.stopPropagation();
			}
		});
	};

	self.show = self.confirm = function(message, buttons, fn) {
		self.callback = fn;

		var builder = [];

		for (var i = 0; i < buttons.length; i++) {
			var item = buttons[i];
			var icon = item.match(/"[a-z0-9-]+"/);
			if (icon) {
				item = item.replace(icon, '').trim();
				icon = '<i class="fa fa-{0}"></i>'.format(icon.toString().replace(/"/g, ''));
			} else
				icon = '';
			builder.push('<button data-index="{1}">{2}{0}</button>'.format(item, i, icon));
		}

		self.content('ui-confirm-warning', '<div class="ui-confirm-message">{0}</div>{1}'.format(message.replace(/\n/g, '<br />'), builder.join('')));
	};

	self.hide = function(index) {
		self.callback && self.callback(index);
		self.rclass('ui-confirm-visible');
		visible = false;
		setTimeout2(self.id, function() {
			$('html').rclass('ui-confirm-noscroll');
			self.aclass('hidden');
		}, 1000);
	};

	self.content = function(cls, text) {
		$('html').aclass('ui-confirm-noscroll');
		!is && self.html('<div><div class="ui-confirm-body"></div></div>');
		self.find('.ui-confirm-body').empty().append(text);
		self.rclass('hidden');
		visible = true;
		setTimeout2(self.id, function() {
			self.aclass('ui-confirm-visible');
		}, 5);
	};
});

COMPONENT('mainprogress', function(self) {

	var old = null;

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();

	self.make = function() {
		self.aclass('ui-mainprogress hidden');
	};

	self.setter = function(value) {
		!value && (value = 0);

		if (old === value)
			return;

		if (value > 100)
			value = 100;
		else if (value < 0)
			value = 0;

		old = value >> 0;

		self.element.stop().animate({ width: old + '%' }, 80).show();
		self.tclass('hidden', old === 0 || old === 100);
	};
});

COMPONENT('notificationspanel', 'top:0;visibleY:1;clear:1;title:Notifications;autoremove:1', function(self, config) {

	var cls = 'ui-' + self.name;
	var cls2 = '.' + cls;
	var container, scrollbar, elclear, items;
	var is = false;

	self.nocompile();
	self.singleton();

	self.make = function() {
		var scr = self.find('script');
		self.aclass(cls + ' hidden');
		self.template = Tangular.compile('<div class="{0}-item" data-index="{{ index }}">{1}</div>'.format(cls, scr.html().trim()));
		self.html('<div class="{0}-header"><span class="{0}-close"><i class="fa fa-caret-square-down"></i></span><i class="fa fa-trash-o {0}-clear"></i><span>{1}</span></div><div class="{0}-container"><div class="{0}-items"></div></div>'.format(cls, config.title));
		scrollbar = SCROLLBAR(self.find(cls2 + '-container'), { visibleY: config.visibleY, parent: self.element });
		container = self.find('.ui-scrollbar-body');
		self.scrolltop = scrollbar.scrollTop;
		self.scrollbottom = scrollbar.scrollBottom;
		elclear = self.find(cls2 + '-clear');
		elclear.on('click', self.clear);
		self.event('click', cls2 + '-item', function() {
			var el = $(this);
			config.click && EXEC(config.click, items[+el.attrd('index')], el);
			if (config.autoremove) {
				el.remove();
				elclear.tclass('hidden', !container.find(cls2 + '-item').length);
			}
		});

		self.event('click', cls2 + '-close', function() {
			self.set(!self.get());
		});

		$(W).on('resize', self.resize);
		self.resize();
	};

	self.resizeforce = function() {
		var css = {};
		css.height = WH;
		css.top = config.top;
		self.css(css);
		delete css.top;
		var content = self.find(cls2 + '-container');
		css.height = css.height - content.offset().top;
		content.css(css);
		scrollbar.resize();
	};

	self.resize = function() {
		setTimeout2(self.ID, self.resizeforce, 300);
	};

	self.render = function(value) {

		if (!value)
			value = EMPTYARRAY;

		items = value;
		var builder = [];
		for (var i = 0; i < value.length; i++) {
			var item = value[i];
			item.index = i;
			builder.push(self.template(item));
		}

		container.html(builder.join(''));
		elclear.tclass('hidden', !builder.length);
		builder.length && self.resizeforce();
	};

	self.clear = function() {
		container.empty();
		elclear.aclass('hidden');
	};

	self.setter = function(value) {
		if (value) {
			EXEC(config.exec, function(value) {
				is = true;
				self.rclass('hidden');
				self.render(value);
			});
		} else {
			self.aclass('hidden');
			is = false;
		}
	};

});

COMPONENT('selected', 'class:selected;selector:a;attr:if', function(self, config) {

	self.bindvisible(20);
	self.readonly();

	self.configure = function(key, value) {
		switch (key) {
			case 'datasource':
				self.datasource(value, self.refresh);
				break;
		}
	};

	self.setter = function(value) {
		var cls = config.class;
		self.find(config.selector).each(function() {
			var el = $(this);
			if (el.attrd(config.attr) === value)
				el.aclass(cls);
			else
				el.hclass(cls) && el.rclass(cls);
		});
	};
});

