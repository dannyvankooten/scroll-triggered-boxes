(function () { var require = undefined; var module = undefined; var exports = undefined; var define = undefined; (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

window.Boxzilla_Admin = require('./admin/_admin.js');

},{"./admin/_admin.js":2}],2:[function(require,module,exports){
"use strict";

var $ = window.jQuery;

var Option = require('./_option.js');

var optionControls = document.getElementById('boxzilla-box-options-controls');
var $optionControls = $(optionControls);
var tnLoggedIn = document.createTextNode(' logged in');

var EventEmitter = require('wolfy87-eventemitter');

var events = new EventEmitter();

var Designer = require('./_designer.js')($, Option, events);

var rowTemplate = window.wp.template('rule-row-template');
var i18n = window.boxzilla_i18n;
var ruleComparisonEl = document.getElementById('boxzilla-rule-comparison');
var rulesContainerEl = document.getElementById('boxzilla-box-rules');
var ajaxurl = window.ajaxurl; // events

$(window).load(function () {
  if (typeof window.tinyMCE === 'undefined') {
    document.getElementById('notice-notinymce').style.display = '';
  }

  $optionControls.on('click', '.boxzilla-add-rule', addRuleFields);
  $optionControls.on('click', '.boxzilla-remove-rule', removeRule);
  $optionControls.on('change', '.boxzilla-rule-condition', setContextualHelpers);
  $optionControls.find('.boxzilla-auto-show-trigger').on('change', toggleTriggerOptions);
  $(ruleComparisonEl).change(toggleAndOrTexts);
  $('.boxzilla-rule-row').each(setContextualHelpers);
});

function toggleAndOrTexts() {
  var newText = ruleComparisonEl.value === 'any' ? i18n.or : i18n.and;
  $('.boxzilla-andor').text(newText);
}

function toggleTriggerOptions() {
  $optionControls.find('.boxzilla-trigger-options').toggle(this.value !== '');
}

function removeRule() {
  var row = $(this).parents('tr'); // delete andor row

  row.prev().remove(); // delete rule row

  row.remove();
}

function setContextualHelpers() {
  var context = this.tagName.toLowerCase() === 'tr' ? this : $(this).parents('tr').get(0);
  var condition = context.querySelector('.boxzilla-rule-condition').value;
  var valueInput = context.querySelector('.boxzilla-rule-value');
  var qualifierInput = context.querySelector('.boxzilla-rule-qualifier');
  var betterInput = valueInput.cloneNode(true);
  var $betterInput = $(betterInput); // remove previously added helpers

  $(context.querySelectorAll('.boxzilla-helper')).remove(); // prepare better input

  betterInput.removeAttribute('name');
  betterInput.className = betterInput.className + ' boxzilla-helper';
  valueInput.parentNode.insertBefore(betterInput, valueInput.nextSibling);
  $betterInput.change(function () {
    valueInput.value = this.value;
  });
  betterInput.style.display = '';
  valueInput.style.display = 'none';
  qualifierInput.style.display = '';
  qualifierInput.querySelector('option[value="not_contains"]').style.display = 'none';
  qualifierInput.querySelector('option[value="contains"]').style.display = 'none';

  if (tnLoggedIn.parentNode) {
    tnLoggedIn.parentNode.removeChild(tnLoggedIn);
  } // change placeholder for textual help


  switch (condition) {
    default:
      betterInput.placeholder = i18n.enterCommaSeparatedValues;
      break;

    case '':
    case 'everywhere':
      qualifierInput.value = '1';
      valueInput.value = '';
      betterInput.style.display = 'none';
      qualifierInput.style.display = 'none';
      break;

    case 'is_single':
    case 'is_post':
      betterInput.placeholder = i18n.enterCommaSeparatedPosts;
      $betterInput.suggest(ajaxurl + '?action=boxzilla_autocomplete&type=post', {
        multiple: true,
        multipleSep: ','
      });
      break;

    case 'is_page':
      betterInput.placeholder = i18n.enterCommaSeparatedPages;
      $betterInput.suggest(ajaxurl + '?action=boxzilla_autocomplete&type=page', {
        multiple: true,
        multipleSep: ','
      });
      break;

    case 'is_post_type':
      betterInput.placeholder = i18n.enterCommaSeparatedPostTypes;
      $betterInput.suggest(ajaxurl + '?action=boxzilla_autocomplete&type=post_type', {
        multiple: true,
        multipleSep: ','
      });
      break;

    case 'is_url':
      qualifierInput.querySelector('option[value="contains"]').style.display = '';
      qualifierInput.querySelector('option[value="not_contains"]').style.display = '';
      betterInput.placeholder = i18n.enterCommaSeparatedRelativeUrls;
      break;

    case 'is_post_in_category':
      $betterInput.suggest(ajaxurl + '?action=boxzilla_autocomplete&type=category', {
        multiple: true,
        multipleSep: ','
      });
      break;

    case 'is_post_with_tag':
      $betterInput.suggest(ajaxurl + '?action=boxzilla_autocomplete&type=post_tag', {
        multiple: true,
        multipleSep: ','
      });
      break;

    case 'is_user_logged_in':
      betterInput.style.display = 'none';
      valueInput.parentNode.insertBefore(tnLoggedIn, valueInput.nextSibling);
      break;

    case 'is_referer':
      qualifierInput.querySelector('option[value="contains"]').style.display = '';
      qualifierInput.querySelector('option[value="not_contains"]').style.display = '';
      break;
  }
}

function addRuleFields() {
  var data = {
    key: optionControls.querySelectorAll('.boxzilla-rule-row').length,
    andor: ruleComparisonEl.value === 'any' ? i18n.or : i18n.and
  };
  var html = rowTemplate(data);
  $(rulesContainerEl).append(html);
  return false;
}

module.exports = {
  Designer: Designer,
  Option: Option,
  events: events
};

},{"./_designer.js":3,"./_option.js":4,"wolfy87-eventemitter":5}],3:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var Designer = function Designer($, Option, events) {
  // vars
  var boxId = document.getElementById('post_ID').value || 0;
  var $editor;
  var $editorFrame;
  var $innerEditor;
  var options = {};
  var visualEditorInitialised = false;
  var $appearanceControls = $('#boxzilla-box-appearance-controls'); // functions

  function init() {
    // Only run if TinyMCE has actually inited
    if (_typeof(window.tinyMCE) !== 'object' || window.tinyMCE.get('content') === null) {
      return;
    } // create Option objects


    options.borderColor = new Option('border-color');
    options.borderWidth = new Option('border-width');
    options.borderStyle = new Option('border-style');
    options.backgroundColor = new Option('background-color');
    options.width = new Option('width');
    options.color = new Option('color'); // add classes to TinyMCE <html>

    $editorFrame = $('#content_ifr');
    $editor = $editorFrame.contents().find('html');
    $editor.css({
      background: 'white'
    }); // add content class and padding to TinyMCE <body>

    $innerEditor = $editor.find('#tinymce');
    $innerEditor.addClass('boxzilla boxzilla-' + boxId);
    $innerEditor.css({
      margin: 0,
      background: 'white',
      display: 'inline-block',
      width: 'auto',
      'min-width': '240px',
      position: 'relative'
    });
    $innerEditor.get(0).style.cssText += ';padding: 25px !important;';
    visualEditorInitialised = true;
    /* @since 2.0.3 */

    events.trigger('editor.init');
  }
  /**
   * Applies the styles from the options to the TinyMCE Editor
   *
   * @return bool
   */


  function applyStyles() {
    if (!visualEditorInitialised) {
      return false;
    } // Apply styles from CSS editor.
    // Use short timeout to make sure color values are updated.


    window.setTimeout(function () {
      $innerEditor.css({
        'border-color': options.borderColor.getColorValue(),
        // getColorValue( 'borderColor', '' ),
        'border-width': options.borderWidth.getPxValue(),
        // getPxValue( 'borderWidth', '' ),
        'border-style': options.borderStyle.getValue(),
        // getValue('borderStyle', '' ),
        'background-color': options.backgroundColor.getColorValue(),
        // getColorValue( 'backgroundColor', ''),
        width: options.width.getPxValue(),
        // getPxValue( 'width', 'auto' ),
        color: options.color.getColorValue() // getColorValue( 'color', '' )

      });
      /* @since 2.0.3 */

      events.trigger('editor.styles.apply');
    }, 10);
    return true;
  }

  function resetStyles() {
    for (var key in options) {
      if (key.substring(0, 5) === 'theme') {
        continue;
      }

      options[key].clear();
    }

    applyStyles();
    /* @since 2.0.3 */

    events.trigger('editor.styles.reset');
  } // event binders


  $appearanceControls.find('input.boxzilla-color-field').wpColorPicker({
    change: applyStyles,
    clear: applyStyles
  });
  $appearanceControls.find(':input').not('.boxzilla-color-field').change(applyStyles);
  events.on('editor.init', applyStyles); // public methods

  return {
    init: init,
    resetStyles: resetStyles,
    options: options
  };
};

module.exports = Designer;

},{}],4:[function(require,module,exports){
"use strict";

var $ = window.jQuery;

var Option = function Option(element) {
  // find corresponding element
  if (typeof element === 'string') {
    element = document.getElementById('boxzilla-' + element);
  }

  if (!element) {
    console.error('Unable to find option element.');
  }

  this.element = element;
};

Option.prototype.getColorValue = function () {
  if (this.element.value.length > 0) {
    if ($(this.element).hasClass('wp-color-field')) {
      return $(this.element).wpColorPicker('color');
    } else {
      return this.element.value;
    }
  }

  return '';
};

Option.prototype.getPxValue = function (fallbackValue) {
  if (this.element.value.length > 0) {
    return parseInt(this.element.value) + 'px';
  }

  return fallbackValue || '';
};

Option.prototype.getValue = function (fallbackValue) {
  if (this.element.value.length > 0) {
    return this.element.value;
  }

  return fallbackValue || '';
};

Option.prototype.clear = function () {
  this.element.value = '';
};

Option.prototype.setValue = function (value) {
  this.element.value = value;
};

module.exports = Option;

},{}],5:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
 * EventEmitter v5.2.9 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - https://oli.me.uk/
 * @preserve
 */
;

(function (exports) {
  'use strict';
  /**
   * Class for managing events.
   * Can be extended to provide event functionality in other classes.
   *
   * @class EventEmitter Manages event registering and emitting.
   */

  function EventEmitter() {} // Shortcuts to improve speed and size


  var proto = EventEmitter.prototype;
  var originalGlobalValue = exports.EventEmitter;
  /**
   * Finds the index of the listener for the event in its storage array.
   *
   * @param {Function[]} listeners Array of listeners to search through.
   * @param {Function} listener Method to look for.
   * @return {Number} Index of the specified listener, -1 if not found
   * @api private
   */

  function indexOfListener(listeners, listener) {
    var i = listeners.length;

    while (i--) {
      if (listeners[i].listener === listener) {
        return i;
      }
    }

    return -1;
  }
  /**
   * Alias a method while keeping the context correct, to allow for overwriting of target method.
   *
   * @param {String} name The name of the target method.
   * @return {Function} The aliased method
   * @api private
   */


  function alias(name) {
    return function aliasClosure() {
      return this[name].apply(this, arguments);
    };
  }
  /**
   * Returns the listener array for the specified event.
   * Will initialise the event object and listener arrays if required.
   * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
   * Each property in the object response is an array of listener functions.
   *
   * @param {String|RegExp} evt Name of the event to return the listeners from.
   * @return {Function[]|Object} All listener functions for the event.
   */


  proto.getListeners = function getListeners(evt) {
    var events = this._getEvents();

    var response;
    var key; // Return a concatenated array of all matching events if
    // the selector is a regular expression.

    if (evt instanceof RegExp) {
      response = {};

      for (key in events) {
        if (events.hasOwnProperty(key) && evt.test(key)) {
          response[key] = events[key];
        }
      }
    } else {
      response = events[evt] || (events[evt] = []);
    }

    return response;
  };
  /**
   * Takes a list of listener objects and flattens it into a list of listener functions.
   *
   * @param {Object[]} listeners Raw listener objects.
   * @return {Function[]} Just the listener functions.
   */


  proto.flattenListeners = function flattenListeners(listeners) {
    var flatListeners = [];
    var i;

    for (i = 0; i < listeners.length; i += 1) {
      flatListeners.push(listeners[i].listener);
    }

    return flatListeners;
  };
  /**
   * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
   *
   * @param {String|RegExp} evt Name of the event to return the listeners from.
   * @return {Object} All listener functions for an event in an object.
   */


  proto.getListenersAsObject = function getListenersAsObject(evt) {
    var listeners = this.getListeners(evt);
    var response;

    if (listeners instanceof Array) {
      response = {};
      response[evt] = listeners;
    }

    return response || listeners;
  };

  function isValidListener(listener) {
    if (typeof listener === 'function' || listener instanceof RegExp) {
      return true;
    } else if (listener && _typeof(listener) === 'object') {
      return isValidListener(listener.listener);
    } else {
      return false;
    }
  }
  /**
   * Adds a listener function to the specified event.
   * The listener will not be added if it is a duplicate.
   * If the listener returns true then it will be removed after it is called.
   * If you pass a regular expression as the event name then the listener will be added to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to attach the listener to.
   * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.addListener = function addListener(evt, listener) {
    if (!isValidListener(listener)) {
      throw new TypeError('listener must be a function');
    }

    var listeners = this.getListenersAsObject(evt);
    var listenerIsWrapped = _typeof(listener) === 'object';
    var key;

    for (key in listeners) {
      if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
        listeners[key].push(listenerIsWrapped ? listener : {
          listener: listener,
          once: false
        });
      }
    }

    return this;
  };
  /**
   * Alias of addListener
   */


  proto.on = alias('addListener');
  /**
   * Semi-alias of addListener. It will add a listener that will be
   * automatically removed after its first execution.
   *
   * @param {String|RegExp} evt Name of the event to attach the listener to.
   * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.addOnceListener = function addOnceListener(evt, listener) {
    return this.addListener(evt, {
      listener: listener,
      once: true
    });
  };
  /**
   * Alias of addOnceListener.
   */


  proto.once = alias('addOnceListener');
  /**
   * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
   * You need to tell it what event names should be matched by a regex.
   *
   * @param {String} evt Name of the event to create.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.defineEvent = function defineEvent(evt) {
    this.getListeners(evt);
    return this;
  };
  /**
   * Uses defineEvent to define multiple events.
   *
   * @param {String[]} evts An array of event names to define.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.defineEvents = function defineEvents(evts) {
    for (var i = 0; i < evts.length; i += 1) {
      this.defineEvent(evts[i]);
    }

    return this;
  };
  /**
   * Removes a listener function from the specified event.
   * When passed a regular expression as the event name, it will remove the listener from all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to remove the listener from.
   * @param {Function} listener Method to remove from the event.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.removeListener = function removeListener(evt, listener) {
    var listeners = this.getListenersAsObject(evt);
    var index;
    var key;

    for (key in listeners) {
      if (listeners.hasOwnProperty(key)) {
        index = indexOfListener(listeners[key], listener);

        if (index !== -1) {
          listeners[key].splice(index, 1);
        }
      }
    }

    return this;
  };
  /**
   * Alias of removeListener
   */


  proto.off = alias('removeListener');
  /**
   * Adds listeners in bulk using the manipulateListeners method.
   * If you pass an object as the first argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
   * You can also pass it a regular expression to add the array of listeners to all events that match it.
   * Yeah, this function does quite a bit. That's probably a bad thing.
   *
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to add.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.addListeners = function addListeners(evt, listeners) {
    // Pass through to manipulateListeners
    return this.manipulateListeners(false, evt, listeners);
  };
  /**
   * Removes listeners in bulk using the manipulateListeners method.
   * If you pass an object as the first argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
   * You can also pass it an event name and an array of listeners to be removed.
   * You can also pass it a regular expression to remove the listeners from all events that match it.
   *
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to remove.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.removeListeners = function removeListeners(evt, listeners) {
    // Pass through to manipulateListeners
    return this.manipulateListeners(true, evt, listeners);
  };
  /**
   * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
   * The first argument will determine if the listeners are removed (true) or added (false).
   * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
   * You can also pass it an event name and an array of listeners to be added/removed.
   * You can also pass it a regular expression to manipulate the listeners of all events that match it.
   *
   * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
    var i;
    var value;
    var single = remove ? this.removeListener : this.addListener;
    var multiple = remove ? this.removeListeners : this.addListeners; // If evt is an object then pass each of its properties to this method

    if (_typeof(evt) === 'object' && !(evt instanceof RegExp)) {
      for (i in evt) {
        if (evt.hasOwnProperty(i) && (value = evt[i])) {
          // Pass the single listener straight through to the singular method
          if (typeof value === 'function') {
            single.call(this, i, value);
          } else {
            // Otherwise pass back to the multiple function
            multiple.call(this, i, value);
          }
        }
      }
    } else {
      // So evt must be a string
      // And listeners must be an array of listeners
      // Loop over it and pass each one to the multiple method
      i = listeners.length;

      while (i--) {
        single.call(this, evt, listeners[i]);
      }
    }

    return this;
  };
  /**
   * Removes all listeners from a specified event.
   * If you do not specify an event then all listeners will be removed.
   * That means every event will be emptied.
   * You can also pass a regex to remove all events that match it.
   *
   * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.removeEvent = function removeEvent(evt) {
    var type = _typeof(evt);

    var events = this._getEvents();

    var key; // Remove different things depending on the state of evt

    if (type === 'string') {
      // Remove all listeners for the specified event
      delete events[evt];
    } else if (evt instanceof RegExp) {
      // Remove all events matching the regex.
      for (key in events) {
        if (events.hasOwnProperty(key) && evt.test(key)) {
          delete events[key];
        }
      }
    } else {
      // Remove all listeners in all events
      delete this._events;
    }

    return this;
  };
  /**
   * Alias of removeEvent.
   *
   * Added to mirror the node API.
   */


  proto.removeAllListeners = alias('removeEvent');
  /**
   * Emits an event of your choice.
   * When emitted, every listener attached to that event will be executed.
   * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
   * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
   * So they will not arrive within the array on the other side, they will be separate.
   * You can also pass a regular expression to emit to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
   * @param {Array} [args] Optional array of arguments to be passed to each listener.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.emitEvent = function emitEvent(evt, args) {
    var listenersMap = this.getListenersAsObject(evt);
    var listeners;
    var listener;
    var i;
    var key;
    var response;

    for (key in listenersMap) {
      if (listenersMap.hasOwnProperty(key)) {
        listeners = listenersMap[key].slice(0);

        for (i = 0; i < listeners.length; i++) {
          // If the listener returns true then it shall be removed from the event
          // The function is executed either with a basic call or an apply if there is an args array
          listener = listeners[i];

          if (listener.once === true) {
            this.removeListener(evt, listener.listener);
          }

          response = listener.listener.apply(this, args || []);

          if (response === this._getOnceReturnValue()) {
            this.removeListener(evt, listener.listener);
          }
        }
      }
    }

    return this;
  };
  /**
   * Alias of emitEvent
   */


  proto.trigger = alias('emitEvent');
  /**
   * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
   * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
   * @param {...*} Optional additional arguments to be passed to each listener.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.emit = function emit(evt) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.emitEvent(evt, args);
  };
  /**
   * Sets the current value to check against when executing listeners. If a
   * listeners return value matches the one set here then it will be removed
   * after execution. This value defaults to true.
   *
   * @param {*} value The new value to check for when executing listeners.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.setOnceReturnValue = function setOnceReturnValue(value) {
    this._onceReturnValue = value;
    return this;
  };
  /**
   * Fetches the current value to check against when executing listeners. If
   * the listeners return value matches this one then it should be removed
   * automatically. It will return true by default.
   *
   * @return {*|Boolean} The current value to check for or the default, true.
   * @api private
   */


  proto._getOnceReturnValue = function _getOnceReturnValue() {
    if (this.hasOwnProperty('_onceReturnValue')) {
      return this._onceReturnValue;
    } else {
      return true;
    }
  };
  /**
   * Fetches the events object and creates one if required.
   *
   * @return {Object} The events storage object.
   * @api private
   */


  proto._getEvents = function _getEvents() {
    return this._events || (this._events = {});
  };
  /**
   * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
   *
   * @return {Function} Non conflicting EventEmitter class.
   */


  EventEmitter.noConflict = function noConflict() {
    exports.EventEmitter = originalGlobalValue;
    return EventEmitter;
  }; // Expose the class either via AMD, CommonJS or the global object


  if (typeof define === 'function' && define.amd) {
    define(function () {
      return EventEmitter;
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object' && module.exports) {
    module.exports = EventEmitter;
  } else {
    exports.EventEmitter = EventEmitter;
  }
})(typeof window !== 'undefined' ? window : void 0 || {});

},{}]},{},[1]);
; })();