(function () { var require = undefined; var module = undefined; var exports = undefined; var define = undefined; (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function () {
  var Boxzilla = require('boxzilla');

  var options = window.boxzilla_options; // helper function for setting CSS styles

  function css(element, styles) {
    if (styles.background_color) {
      element.style.background = styles.background_color;
    }

    if (styles.color) {
      element.style.color = styles.color;
    }

    if (styles.border_color) {
      element.style.borderColor = styles.border_color;
    }

    if (styles.border_width) {
      element.style.borderWidth = parseInt(styles.border_width) + 'px';
    }

    if (styles.border_style) {
      element.style.borderStyle = styles.border_style;
    }

    if (styles.width) {
      element.style.maxWidth = parseInt(styles.width) + 'px';
    }
  }

  function createBoxesFromConfig() {
    // failsafe against including script twice.
    if (options.inited) {
      return;
    } // create boxes from options


    for (var key in options.boxes) {
      // get opts
      var boxOpts = options.boxes[key];
      boxOpts.testMode = isLoggedIn && options.testMode; // find box content element, bail if not found

      var boxContentElement = document.getElementById('boxzilla-box-' + boxOpts.id + '-content');

      if (!boxContentElement) {
        continue;
      } // use element as content option


      boxOpts.content = boxContentElement; // create box

      var box = Boxzilla.create(boxOpts.id, boxOpts); // add box slug to box element as classname

      box.element.className = box.element.className + ' boxzilla-' + boxOpts.post.slug; // add custom css to box

      css(box.element, boxOpts.css);

      try {
        box.element.firstChild.firstChild.className += ' first-child';
        box.element.firstChild.lastChild.className += ' last-child';
      } catch (e) {} // maybe show box right away


      if (box.fits() && locationHashRefersBox(box)) {
        box.show();
      }
    } // set flag to prevent initialising twice


    options.inited = true; // trigger "done" event.

    Boxzilla.trigger('done'); // maybe open box with MC4WP form in it

    maybeOpenMailChimpForWordPressBox();
  }

  function locationHashRefersBox(box) {
    if (!window.location.hash || window.location.hash.length === 0) {
      return false;
    } // parse "boxzilla-{id}" from location hash


    var match = window.location.hash.match(/[#&](boxzilla-\d+)/);

    if (!match || _typeof(match) !== 'object' || match.length < 2) {
      return false;
    }

    var elementId = match[1];

    if (elementId === box.element.id) {
      return true;
    } else if (box.element.querySelector('#' + elementId)) {
      return true;
    }

    return false;
  }

  function maybeOpenMailChimpForWordPressBox() {
    if ((_typeof(window.mc4wp_forms_config) !== 'object' || !window.mc4wp_forms_config.submitted_form) && _typeof(window.mc4wp_submitted_form) !== 'object') {
      return;
    }

    var form = window.mc4wp_submitted_form || window.mc4wp_forms_config.submitted_form;
    var selector = '#' + form.element_id;
    Boxzilla.boxes.forEach(function (box) {
      if (box.element.querySelector(selector)) {
        box.show();
      }
    });
  } // print message when test mode is enabled


  var isLoggedIn = document.body && document.body.className && document.body.className.indexOf('logged-in') > -1;

  if (isLoggedIn && options.testMode) {
    console.log('Boxzilla: Test mode is enabled. Please disable test mode if you\'re done testing.');
  } // init boxzilla


  Boxzilla.init(); // on window.load, create DOM elements for boxes

  window.addEventListener('load', createBoxesFromConfig);
})();

},{"boxzilla":4}],2:[function(require,module,exports){
"use strict";

var duration = 320;

function css(element, styles) {
  for (var property in styles) {
    if (!styles.hasOwnProperty(property)) {
      continue;
    }

    element.style[property] = styles[property];
  }
}

function initObjectProperties(properties, value) {
  var newObject = {};

  for (var i = 0; i < properties.length; i++) {
    newObject[properties[i]] = value;
  }

  return newObject;
}

function copyObjectProperties(properties, object) {
  var newObject = {};

  for (var i = 0; i < properties.length; i++) {
    newObject[properties[i]] = object[properties[i]];
  }

  return newObject;
}
/**
 * Checks if the given element is currently being animated.
 *
 * @param element
 * @returns {boolean}
 */


function animated(element) {
  return !!element.getAttribute('data-animated');
}
/**
 * Toggles the element using the given animation.
 *
 * @param element
 * @param animation Either "fade" or "slide"
 * @param callbackFn
 */


function toggle(element, animation, callbackFn) {
  var nowVisible = element.style.display !== 'none' || element.offsetLeft > 0; // create clone for reference

  var clone = element.cloneNode(true);

  var cleanup = function cleanup() {
    element.removeAttribute('data-animated');
    element.setAttribute('style', clone.getAttribute('style'));
    element.style.display = nowVisible ? 'none' : '';

    if (callbackFn) {
      callbackFn();
    }
  }; // store attribute so everyone knows we're animating this element


  element.setAttribute('data-animated', 'true'); // toggle element visiblity right away if we're making something visible

  if (!nowVisible) {
    element.style.display = '';
  }

  var hiddenStyles;
  var visibleStyles; // animate properties

  if (animation === 'slide') {
    hiddenStyles = initObjectProperties(['height', 'borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom'], 0);
    visibleStyles = {};

    if (!nowVisible) {
      var computedStyles = window.getComputedStyle(element);
      visibleStyles = copyObjectProperties(['height', 'borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom'], computedStyles); // in some browsers, getComputedStyle returns "auto" value. this falls back to getBoundingClientRect() in those browsers since we need an actual height.

      if (!isFinite(visibleStyles.height)) {
        var clientRect = element.getBoundingClientRect();
        visibleStyles.height = clientRect.height;
      }

      css(element, hiddenStyles);
    } // don't show a scrollbar during animation


    element.style.overflowY = 'hidden';
    animate(element, nowVisible ? hiddenStyles : visibleStyles, cleanup);
  } else {
    hiddenStyles = {
      opacity: 0
    };
    visibleStyles = {
      opacity: 1
    };

    if (!nowVisible) {
      css(element, hiddenStyles);
    }

    animate(element, nowVisible ? hiddenStyles : visibleStyles, cleanup);
  }
}

function animate(element, targetStyles, fn) {
  var last = +new Date();
  var initialStyles = window.getComputedStyle(element);
  var currentStyles = {};
  var propSteps = {};

  for (var property in targetStyles) {
    if (!targetStyles.hasOwnProperty(property)) {
      continue;
    } // make sure we have an object filled with floats


    targetStyles[property] = parseFloat(targetStyles[property]); // calculate step size & current value

    var to = targetStyles[property];
    var current = parseFloat(initialStyles[property]); // is there something to do?

    if (current === to) {
      delete targetStyles[property];
      continue;
    }

    propSteps[property] = (to - current) / duration; // points per second

    currentStyles[property] = current;
  }

  var tick = function tick() {
    var now = +new Date();
    var timeSinceLastTick = now - last;
    var done = true;
    var step, to, increment, newValue;

    for (var _property in targetStyles) {
      if (!targetStyles.hasOwnProperty(_property)) {
        continue;
      }

      step = propSteps[_property];
      to = targetStyles[_property];
      increment = step * timeSinceLastTick;
      newValue = currentStyles[_property] + increment;

      if (step > 0 && newValue >= to || step < 0 && newValue <= to) {
        newValue = to;
      } else {
        done = false;
      } // store new value


      currentStyles[_property] = newValue;
      element.style[_property] = _property !== 'opacity' ? newValue + 'px' : newValue;
    }

    last = +new Date();

    if (!done) {
      // keep going until we're done for all props
      window.requestAnimationFrame(tick);
    } else {
      // call callback
      fn && fn();
    }
  };

  tick();
}

module.exports = {
  toggle: toggle,
  animate: animate,
  animated: animated
};

},{}],3:[function(require,module,exports){
"use strict";

var defaults = {
  animation: 'fade',
  rehide: false,
  content: '',
  cookie: null,
  icon: '&times',
  screenWidthCondition: null,
  position: 'center',
  testMode: false,
  trigger: false,
  closable: true
};

var Animator = require('./animator.js');
/**
 * Merge 2 objects, values of the latter overwriting the former.
 *
 * @param obj1
 * @param obj2
 * @returns {*}
 */


function merge(obj1, obj2) {
  var obj3 = {}; // add obj1 to obj3

  for (var attrname in obj1) {
    if (obj1.hasOwnProperty(attrname)) {
      obj3[attrname] = obj1[attrname];
    }
  } // add obj2 to obj3


  for (var _attrname in obj2) {
    if (obj2.hasOwnProperty(_attrname)) {
      obj3[_attrname] = obj2[_attrname];
    }
  }

  return obj3;
}
/**
 * Get the real height of entire document.
 * @returns {number}
 */


function getDocumentHeight() {
  var body = document.body;
  var html = document.documentElement;
  return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
} // Box Object


function Box(id, config, fireEvent) {
  this.id = id;
  this.fireEvent = fireEvent; // store config values

  this.config = merge(defaults, config); // add overlay element to dom and store ref to overlay

  this.overlay = document.createElement('div');
  this.overlay.style.display = 'none';
  this.overlay.id = 'boxzilla-overlay-' + this.id;
  this.overlay.classList.add('boxzilla-overlay');
  document.body.appendChild(this.overlay); // state

  this.visible = false;
  this.dismissed = false;
  this.triggered = false;
  this.triggerHeight = this.calculateTriggerHeight();
  this.cookieSet = this.isCookieSet();
  this.element = null;
  this.contentElement = null;
  this.closeIcon = null; // create dom elements for this box

  this.dom(); // further initialise the box

  this.events();
} // initialise the box


Box.prototype.events = function () {
  var box = this; // attach event to "close" icon inside box

  if (this.closeIcon) {
    this.closeIcon.addEventListener('click', function (evt) {
      evt.preventDefault();
      box.dismiss();
    });
  }

  this.element.addEventListener('click', function (evt) {
    if (evt.target.tagName === 'A' || evt.target.tagName === 'AREA') {
      box.fireEvent('box.interactions.link', [box, evt.target]);
    }
  }, false);
  this.element.addEventListener('submit', function (evt) {
    box.setCookie();
    box.fireEvent('box.interactions.form', [box, evt.target]);
  }, false);
  this.overlay.addEventListener('click', function (evt) {
    var x = evt.offsetX;
    var y = evt.offsetY; // calculate if click was less than 40px outside box to avoid closing it by accident

    var rect = box.element.getBoundingClientRect();
    var margin = 40; // if click was not anywhere near box, dismiss it.

    if (x < rect.left - margin || x > rect.right + margin || y < rect.top - margin || y > rect.bottom + margin) {
      box.dismiss();
    }
  });
}; // generate dom elements for this box


Box.prototype.dom = function () {
  var wrapper = document.createElement('div');
  wrapper.className = 'boxzilla-container boxzilla-' + this.config.position + '-container';
  var box = document.createElement('div');
  box.id = 'boxzilla-' + this.id;
  box.className = 'boxzilla boxzilla-' + this.id + ' boxzilla-' + this.config.position;
  box.style.display = 'none';
  wrapper.appendChild(box);
  var content;

  if (typeof this.config.content === 'string') {
    content = document.createElement('div');
    content.innerHTML = this.config.content;
  } else {
    content = this.config.content; // make sure element is visible

    content.style.display = '';
  }

  content.className = 'boxzilla-content';
  box.appendChild(content);

  if (this.config.closable && this.config.icon) {
    var closeIcon = document.createElement('span');
    closeIcon.className = 'boxzilla-close-icon';
    closeIcon.innerHTML = this.config.icon;
    closeIcon.setAttribute('aria-label', 'close');
    box.appendChild(closeIcon);
    this.closeIcon = closeIcon;
  }

  document.body.appendChild(wrapper);
  this.contentElement = content;
  this.element = box;
}; // set (calculate) custom box styling depending on box options


Box.prototype.setCustomBoxStyling = function () {
  // reset element to its initial state
  var origDisplay = this.element.style.display;
  this.element.style.display = '';
  this.element.style.overflowY = '';
  this.element.style.maxHeight = ''; // get new dimensions

  var windowHeight = window.innerHeight;
  var boxHeight = this.element.clientHeight; // add scrollbar to box and limit height

  if (boxHeight > windowHeight) {
    this.element.style.maxHeight = windowHeight + 'px';
    this.element.style.overflowY = 'scroll';
  } // set new top margin for boxes which are centered


  if (this.config.position === 'center') {
    var newTopMargin = (windowHeight - boxHeight) / 2;
    newTopMargin = newTopMargin >= 0 ? newTopMargin : 0;
    this.element.style.marginTop = newTopMargin + 'px';
  }

  this.element.style.display = origDisplay;
}; // toggle visibility of the box


Box.prototype.toggle = function (show, animate) {
  show = typeof show === 'undefined' ? !this.visible : show;
  animate = typeof animate === 'undefined' ? true : animate; // is box already at desired visibility?

  if (show === this.visible) {
    return false;
  } // is box being animated?


  if (Animator.animated(this.element)) {
    return false;
  } // if box should be hidden but is not closable, bail.


  if (!show && !this.config.closable) {
    return false;
  } // set new visibility status


  this.visible = show; // calculate new styling rules

  this.setCustomBoxStyling(); // trigger event

  this.fireEvent('box.' + (show ? 'show' : 'hide'), [this]); // show or hide box using selected animation

  if (this.config.position === 'center') {
    this.overlay.classList.toggle('boxzilla-' + this.id + '-overlay');

    if (animate) {
      Animator.toggle(this.overlay, 'fade');
    } else {
      this.overlay.style.display = show ? '' : 'none';
    }
  }

  if (animate) {
    Animator.toggle(this.element, this.config.animation, function () {
      if (this.visible) {
        return;
      }

      this.contentElement.innerHTML = this.contentElement.innerHTML + '';
    }.bind(this));
  } else {
    this.element.style.display = show ? '' : 'none';
  }

  return true;
}; // show the box


Box.prototype.show = function (animate) {
  return this.toggle(true, animate);
}; // hide the box


Box.prototype.hide = function (animate) {
  return this.toggle(false, animate);
}; // calculate trigger height


Box.prototype.calculateTriggerHeight = function () {
  var triggerHeight = {
    show: 0,
    hide: 0
  };

  if (this.config.trigger) {
    if (this.config.trigger.method === 'element') {
      var triggerElement = document.body.querySelector(this.config.trigger.value);

      if (triggerElement) {
        var offset = triggerElement.getBoundingClientRect();
        triggerHeight.show = offset.top;
      }
    } else if (this.config.trigger.method === 'percentage') {
      triggerHeight.show = this.config.trigger.value / 100 * getDocumentHeight();
    }
  }

  if (this.config.triggerHide) {
    if (this.config.triggerHide.method === 'element') {
      var triggerHideElement = document.body.querySelector(this.config.triggerHide.value);

      if (triggerHideElement) {
        var _offset = triggerHideElement.getBoundingClientRect();

        triggerHeight.hide = _offset.top;
      }
    } else if (this.config.triggerHide.method === 'percentage') {
      triggerHeight.hide = this.config.triggerHide.value / 100 * getDocumentHeight();
    }
  }

  return triggerHeight;
};

Box.prototype.fits = function () {
  if (!this.config.screenWidthCondition || !this.config.screenWidthCondition.value) {
    return true;
  }

  switch (this.config.screenWidthCondition.condition) {
    case 'larger':
      return window.innerWidth > this.config.screenWidthCondition.value;

    case 'smaller':
      return window.innerWidth < this.config.screenWidthCondition.value;
  } // meh.. condition should be "smaller" or "larger", just return true.


  return true;
};

Box.prototype.onResize = function () {
  this.triggerHeight = this.calculateTriggerHeight();
  this.setCustomBoxStyling();
}; // is this box enabled?


Box.prototype.mayAutoShow = function () {
  if (this.dismissed) {
    return false;
  } // check if box fits on given minimum screen width


  if (!this.fits()) {
    return false;
  } // if trigger empty or error in calculating triggerHeight, return false


  if (!this.config.trigger) {
    return false;
  } // rely on cookie value (show if not set, don't show if set)


  return !this.cookieSet;
};

Box.prototype.mayRehide = function () {
  return this.config.rehide && this.triggered;
};

Box.prototype.isCookieSet = function () {
  // always show on test mode or when no auto-trigger is configured
  if (this.config.testMode || !this.config.trigger) {
    return false;
  } // if either cookie is null or trigger & dismiss are both falsey, don't bother checking.


  if (!this.config.cookie || !this.config.cookie.triggered && !this.config.cookie.dismissed) {
    return false;
  }

  return document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + 'boxzilla_box_' + this.id + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1') === 'true';
}; // set cookie that disables automatically showing the box


Box.prototype.setCookie = function (hours) {
  var expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + hours);
  document.cookie = 'boxzilla_box_' + this.id + '=true; expires=' + expiryDate.toUTCString() + '; path=/';
};

Box.prototype.trigger = function () {
  var shown = this.show();

  if (!shown) {
    return;
  }

  this.triggered = true;

  if (this.config.cookie && this.config.cookie.triggered) {
    this.setCookie(this.config.cookie.triggered);
  }
};
/**
 * Dismisses the box and optionally sets a cookie.
 * @param animate
 * @returns {boolean}
 */


Box.prototype.dismiss = function (animate) {
  // only dismiss box if it's currently open.
  if (!this.visible) {
    return false;
  } // hide box element


  this.hide(animate); // set cookie

  if (this.config.cookie && this.config.cookie.dismissed) {
    this.setCookie(this.config.cookie.dismissed);
  }

  this.dismissed = true;
  this.fireEvent('box.dismiss', [this]);
  return true;
};

module.exports = Box;

},{"./animator.js":2}],4:[function(require,module,exports){
"use strict";

var Box = require('./box.js');

var throttle = require('./util.js').throttle;

var styles = require('./styles.js');

var ExitIntent = require('./triggers/exit-intent.js');

var Scroll = require('./triggers/scroll.js');

var Pageviews = require('./triggers/pageviews.js');

var Time = require('./triggers/time.js');

var initialised = false;
var boxes = [];
var listeners = {};

function onKeyUp(evt) {
  if (evt.key === 'Escape' || evt.key === 'Esc') {
    dismiss();
  }
}

function recalculateHeights() {
  boxes.forEach(function (box) {
    return box.onResize();
  });
}

function onElementClick(evt) {
  // bubble up to <a> or <area> element
  var el = evt.target;

  for (var i = 0; i <= 3; i++) {
    if (!el || el.tagName === 'A' || el.tagName === 'AREA') {
      break;
    }

    el = el.parentElement;
  }

  if (!el || el.tagName !== 'A' && el.tagName !== 'AREA' || !el.href) {
    return;
  }

  var match = el.href.match(/[#&]boxzilla-(.+)/i);

  if (match && match.length > 1) {
    toggle(match[1]);
  }
}

function trigger(event, args) {
  listeners[event] && listeners[event].forEach(function (f) {
    return f.apply(null, args);
  });
}

function on(event, fn) {
  listeners[event] = listeners[event] || [];
  listeners[event].push(fn);
}

function off(event, fn) {
  listeners[event] && listeners[event].filter(function (f) {
    return f !== fn;
  });
} // initialise & add event listeners


function init() {
  if (initialised) {
    return;
  } // insert styles into DOM


  var styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement); // init triggers

  ExitIntent(boxes);
  Pageviews(boxes);
  Scroll(boxes);
  Time(boxes);
  document.body.addEventListener('click', onElementClick, true);
  window.addEventListener('resize', throttle(recalculateHeights));
  window.addEventListener('load', recalculateHeights);
  document.addEventListener('keyup', onKeyUp);
  trigger('ready');
  initialised = true; // ensure this function doesn't run again
}

function create(id, opts) {
  // preserve backwards compat for minimumScreenWidth option
  if (typeof opts.minimumScreenWidth !== 'undefined') {
    opts.screenWidthCondition = {
      condition: 'larger',
      value: opts.minimumScreenWidth
    };
  }

  id = String(id);
  var box = new Box(id, opts, trigger);
  boxes.push(box);
  return box;
}

function get(id) {
  id = String(id);

  for (var i = 0; i < boxes.length; i++) {
    if (boxes[i].id === id) {
      return boxes[i];
    }
  }

  throw new Error('No box exists with ID ' + id);
} // dismiss a single box (or all by omitting id param)


function dismiss(id, animate) {
  if (id) {
    get(id).dismiss(animate);
  } else {
    boxes.forEach(function (box) {
      return box.dismiss(animate);
    });
  }
}

function hide(id, animate) {
  if (id) {
    get(id).hide(animate);
  } else {
    boxes.forEach(function (box) {
      return box.hide(animate);
    });
  }
}

function show(id, animate) {
  if (id) {
    get(id).show(animate);
  } else {
    boxes.forEach(function (box) {
      return box.show(animate);
    });
  }
}

function toggle(id, animate) {
  if (id) {
    get(id).toggle(animate);
  } else {
    boxes.forEach(function (box) {
      return box.toggle(animate);
    });
  }
} // expose boxzilla object


var Boxzilla = {
  off: off,
  on: on,
  get: get,
  init: init,
  create: create,
  trigger: trigger,
  show: show,
  hide: hide,
  dismiss: dismiss,
  toggle: toggle,
  boxes: boxes
};
window.Boxzilla = Boxzilla;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Boxzilla;
}

},{"./box.js":3,"./styles.js":5,"./triggers/exit-intent.js":7,"./triggers/pageviews.js":8,"./triggers/scroll.js":9,"./triggers/time.js":10,"./util.js":11}],5:[function(require,module,exports){
"use strict";

var styles = "#boxzilla-overlay,.boxzilla-overlay{position:fixed;background:rgba(0,0,0,.65);width:100%;height:100%;left:0;top:0;z-index:10000}.boxzilla-center-container{position:fixed;top:0;left:0;right:0;height:0;text-align:center;z-index:11000;line-height:0}.boxzilla-center-container .boxzilla{display:inline-block;text-align:left;position:relative;line-height:normal}.boxzilla{position:fixed;z-index:12000;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;background:#fff;padding:25px}.boxzilla.boxzilla-top-left{top:0;left:0}.boxzilla.boxzilla-top-right{top:0;right:0}.boxzilla.boxzilla-bottom-left{bottom:0;left:0}.boxzilla.boxzilla-bottom-right{bottom:0;right:0}.boxzilla-content>:first-child{margin-top:0;padding-top:0}.boxzilla-content>:last-child{margin-bottom:0;padding-bottom:0}.boxzilla-close-icon{position:absolute;right:0;top:0;text-align:center;padding:6px;cursor:pointer;-webkit-appearance:none;font-size:28px;font-weight:700;line-height:20px;color:#000;opacity:.5}.boxzilla-close-icon:focus,.boxzilla-close-icon:hover{opacity:.8}";
module.exports = styles;

},{}],6:[function(require,module,exports){
"use strict";

var Timer = function Timer() {
  this.time = 0;
  this.interval = 0;
};

Timer.prototype.tick = function () {
  this.time++;
};

Timer.prototype.start = function () {
  if (!this.interval) {
    this.interval = window.setInterval(this.tick.bind(this), 1000);
  }
};

Timer.prototype.stop = function () {
  if (this.interval) {
    window.clearInterval(this.interval);
    this.interval = 0;
  }
};

module.exports = Timer;

},{}],7:[function(require,module,exports){
"use strict";

module.exports = function (boxes) {
  var timeout = null;
  var touchStart = {};

  function trigger() {
    document.documentElement.removeEventListener('mouseleave', onMouseLeave);
    document.documentElement.removeEventListener('mouseenter', onMouseEnter);
    document.documentElement.removeEventListener('click', clearTimeout);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchend', onTouchEnd); // show boxes with exit intent trigger

    boxes.forEach(function (box) {
      if (box.mayAutoShow() && box.config.trigger.method === 'exit_intent') {
        box.trigger();
      }
    });
  }

  function clearTimeout() {
    if (timeout === null) {
      return;
    }

    window.clearTimeout(timeout);
    timeout = null;
  }

  function onMouseEnter() {
    clearTimeout();
  }

  function getAddressBarY() {
    if (document.documentMode || /Edge\//.test(navigator.userAgent)) {
      return 5;
    }

    return 0;
  }

  function onMouseLeave(evt) {
    clearTimeout(); // did mouse leave at top of window?
    // add small exception space in the top-right corner

    if (evt.clientY <= getAddressBarY() && evt.clientX < 0.8 * window.innerWidth) {
      timeout = window.setTimeout(trigger, 600);
    }
  }

  function onTouchStart() {
    clearTimeout();
    touchStart = {
      timestamp: performance.now(),
      scrollY: window.scrollY,
      windowHeight: window.innerHeight
    };
  }

  function onTouchEnd(evt) {
    clearTimeout(); // did address bar appear?

    if (window.innerHeight > touchStart.windowHeight) {
      return;
    } // allow a tiny tiny margin for error, to not fire on clicks


    if (window.scrollY + 20 > touchStart.scrollY) {
      return;
    }

    if (performance.now() - touchStart.timestamp > 300) {
      return;
    }

    if (['A', 'INPUT', 'BUTTON'].indexOf(evt.target.tagName) > -1) {
      return;
    }

    timeout = window.setTimeout(trigger, 800);
  }

  window.addEventListener('touchstart', onTouchStart);
  window.addEventListener('touchend', onTouchEnd);
  document.documentElement.addEventListener('mouseenter', onMouseEnter);
  document.documentElement.addEventListener('mouseleave', onMouseLeave);
  document.documentElement.addEventListener('click', clearTimeout);
};

},{}],8:[function(require,module,exports){
"use strict";

module.exports = function (boxes) {
  var pageviews;

  try {
    pageviews = sessionStorage.getItem('boxzilla_pageviews') || 0;
    sessionStorage.setItem('boxzilla_pageviews', ++pageviews);
  } catch (e) {
    pageviews = 0;
  }

  window.setTimeout(function () {
    boxes.forEach(function (box) {
      if (box.config.trigger.method === 'pageviews' && pageviews > box.config.trigger.value && box.mayAutoShow()) {
        box.trigger();
      }
    });
  }, 1000);
};

},{}],9:[function(require,module,exports){
"use strict";

var throttle = require('../util.js').throttle;

module.exports = function (boxes) {
  // check triggerHeight criteria for all boxes
  function checkHeightCriteria() {
    var scrollY = window.hasOwnProperty('pageYOffset') ? window.pageYOffset : window.scrollTop;
    scrollY = scrollY + window.innerHeight * 0.9;
    boxes.forEach(function (box) {
      if (!box.mayAutoShow() || box.triggerHeight.show <= 0) {
        return;
      }

      if (box.triggerHeight.hide > box.triggerHeight.show && scrollY > box.triggerHeight.hide || box.triggerHeight.hide < box.triggerHeight.show && scrollY < box.triggerHeight.hide) {
        box.hide();
      } else if (scrollY > box.triggerHeight.show) {
        box.trigger();
      } else if (box.mayRehide() && scrollY < box.triggerHeight.show - 5) {
        // if box may auto-hide and scrollY is less than triggerHeight (with small margin of error), hide box
        box.hide();
      }
    });
  }

  window.addEventListener('touchstart', throttle(checkHeightCriteria), true);
  window.addEventListener('scroll', throttle(checkHeightCriteria), true);
};

},{"../util.js":11}],10:[function(require,module,exports){
"use strict";

var Timer = require('../timer.js');

module.exports = function (boxes) {
  var siteTimer = new Timer();
  var pageTimer = new Timer();
  var timers = {
    start: function start() {
      try {
        var sessionTime = parseInt(sessionStorage.getItem('boxzilla_timer'));

        if (sessionTime) {
          siteTimer.time = sessionTime;
        }
      } catch (e) {}

      siteTimer.start();
      pageTimer.start();
    },
    stop: function stop() {
      sessionStorage.setItem('boxzilla_timer', siteTimer.time);
      siteTimer.stop();
      pageTimer.stop();
    }
  }; // start timers

  timers.start(); // stop timers when leaving page or switching to other tab

  document.addEventListener('visibilitychange', function () {
    document.hidden ? timers.stop() : timers.start();
  });
  window.addEventListener('beforeunload', function () {
    timers.stop();
  });
  window.setInterval(function () {
    boxes.forEach(function (box) {
      if (box.config.trigger.method === 'time_on_site' && siteTimer.time > box.config.trigger.value && box.mayAutoShow()) {
        box.trigger();
      } else if (box.config.trigger.method === 'time_on_page' && pageTimer.time > box.config.trigger.value && box.mayAutoShow()) {
        box.trigger();
      }
    });
  }, 1000);
};

},{"../timer.js":6}],11:[function(require,module,exports){
"use strict";

function throttle(fn, threshold, scope) {
  threshold || (threshold = 800);
  var last;
  var deferTimer;
  return function () {
    var context = scope || this;
    var now = +new Date();
    var args = arguments;

    if (last && now < last + threshold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

module.exports = {
  throttle: throttle
};

},{}]},{},[1]);
; })();