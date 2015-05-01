(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = (function() {
	'use strict';

	var $ = window.jQuery,
		console  = window.console || { log: function() { }},
		isLoggedIn = $(document.body).hasClass('logged-in'),
		startTime = new Date().getTime();

	// Box Object
	var Box = function( config ) {
		this.id 		= config.id;
		this.element 	= config.element;
		this.$element 	= $(config.element);
		this._borderWidths = {};

		// store config values
		this.config = config;

		// store ref to overlay
		this.overlay = document.getElementById('stb-overlay');

		// state
		this.visible 	= false;
		this.closed 	= false;
		this.triggered 	= false;
		this.triggerHeight = 0;
		this.cookieSet = false;

		// if a trigger was given, calculate some values which might otherwise be expensive)
		if( this.config.autoShow && this.config.trigger !== '' ) {
			this.triggerHeight = this.calculateTriggerHeight( config.triggerPercentage, config.triggerElementSelector );
			this.cookieSet = this.isCookieSet();
		}

		// further initialise the box
		this.init();
	};

	// initialise the box
	Box.prototype.init = function() {
		// attach event to "close" icon inside box
		this.$element.find('.stb-close').click(this.disable.bind(this));

		// attach event to all links referring #stb-{box_id}
		$('a[href="#' + this.$element.attr('id') +'"]').click(function() { this.toggle(); return false; }.bind(this));

		// auto-show the box if box is referenced from URL
		if( this.locationHashRefersBox() ) {
			window.setTimeout(this.show.bind(this), 300);
		}
	};


	// set (calculate) custom box styling depending on box options
	Box.prototype.setCustomBoxStyling = function() {

		// reset element to its initial state
		this.element.style.overflowY = 'auto';
		this.element.style.maxHeight = 'none';

		// get new dimensions
		var windowHeight = window.innerHeight;
		var boxHeight = this.$element.outerHeight();

		// does box + margin fit on screen?
		if( ( boxHeight + 40 ) > windowHeight ) {

			// add scrollbar to box and limit height
			this.element.style.maxHeight = ( windowHeight - 40 ) + "px";
			this.element.style.overflowY = 'scroll';

		}

		// set new top margin for boxes which are centered
		if( this.config.position === 'center' ) {
			var newTopMargin = ( ( windowHeight - boxHeight ) / 2 );
			if( newTopMargin < 20 ) newTopMargin = 20;
			this.element.style.marginTop = newTopMargin + "px";
		}

	};

	// toggle visibility of the box
	Box.prototype.toggle = function(show) {

		// revert visibility if no explicit argument is given
		if( typeof( show ) === "undefined" ) {
			show = ! this.visible;
		}

		// do nothing if element is being animated
		if( this.$element.is(':animated') ) {
			return false;
		}

		// is box already at desired visibility?
		if( show === this.visible ) {
			return false;
		}

		// set new visibility status
		this.visible = show;

		// fadein / fadeout the overlay if position is "center"
		this.setCustomBoxStyling();

		if( this.config.position === 'center' ) {
			$(this.overlay).fadeToggle('slow');
		}

		// show or hide box using selected animation
		if( this.config.animation === 'fade' ) {
			this.$element.fadeToggle();
		} else {
			this.prepareBorderAnimation();
			this.$element.slideToggle({ 'progress': this.animateBorder.bind(this) });
		}

		return true;
	};

	Box.prototype.prepareBorderAnimation = function() {
		var borders = [ "borderTopWidth", "borderBottomWidth", "borderLeftWidth", "borderRightWidth" ];
		this._borderWidths = {};

		console.log( this.$element.css('borderTopWidth' ) );
		for( var i=0; i<borders.length; i++ ) {
			this._borderWidths[borders[i]] = parseInt( this.$element.css(borders[i]) );
			if( this.visible ) {
				this.element.style[borders[i]] = 0;
			}
		}
	};

	Box.prototype.animateBorder = function( animation, progress, remainingMs) {
		for(var border in this._borderWidths ) {

			if( this._borderWidths[border] == 0 ) {
				continue;
			}

			var borderSize = ( this._borderWidths[border] * progress );
			if( ! this.visible ) {
				borderSize = this._borderWidths[border] - borderSize;
			}

			this.element.style[border] = ( borderSize ) + "px";
		}
	};

	// show the box
	Box.prototype.show = function() {
		return this.toggle(true);
	};

	// hide the box
	Box.prototype.hide = function() {
		return this.toggle(false);
	};

	// calculate trigger height
	Box.prototype.calculateTriggerHeight = function( triggerPercentage, triggerElementSelector ) {

		if( this.config.trigger === 'element' ) {
			var $triggerElement = $(triggerElementSelector).first();
			if( $triggerElement.length > 0 ) {
				// return top offset of element
				return $triggerElement.offset().top;
			} else {
				// element was not found, disable box.
				return 0;
			}
		}

		// calcate % of page height
		return ( triggerPercentage / 100 * $(document).height() );
	};

	// set cookie that disables automatically showing the box
	Box.prototype.setCookie = function() {
		if(this.config.cookieTime > 0) {
			var expiryDate = new Date();
			expiryDate.setDate( expiryDate.getDate() + this.cookieTime );
			document.cookie = 'stb_box_'+ this.id + '=true; expires='+ expiryDate.toUTCString() +'; path=/';
		}
	};

	// checks whether window.location.hash equals the box element ID of that of any
	Box.prototype.locationHashRefersBox = function() {

		if( ! window.location.hash || 0 === window.location.hash.length ) {
			return false;
		}

		var elementId = window.location.hash.substring(1);
		if( elementId === this.element.id ) {
			return true;
		} else if( this.element.querySelector('#' + elementId) ) {
			return true;
		}

		return false;
	};

	// is this box enabled?
	Box.prototype.mayAutoShow = function() {

		// don't show if autoShow is disabled
		if( ! this.config.autoShow ) {
			return false;
		}

		// don't show if box was closed before
		if( this.closed ) {
			return false;
		}

		// don't show if triggerHeight is 0 (element not found or percentage set to 0)
		if( this.triggerHeight === 0 ) {
			return false;
		}

		// check if box fits on given minimum screen width
		if( this.config.minimumScreenWidth > 0 && window.innerWidth < this.config.minimumScreenWidth ) {
			return false;
		}

		// don't show if page just loaded ( 500ms)
		// todo: make an option out of this
		var currentTime = new Date().getTime();
		if( ( startTime + 500 ) > currentTime ) {
			return false;
		}

		// rely on cookie value (show if not set, don't show if set)
		return ! this.cookieSet;
	};

	Box.prototype.mayAutoHide = function() {

		// check if autoHide was allowed from config
		if( ! this.config.autoHide ) {
			return false;
		}

		// only allow autoHide when box has been autoshown (triggered)
		return this.triggered;
	};

	Box.prototype.isCookieSet = function() {
		// always show on test mode
		if( isLoggedIn && this.config.testMode ) {
			return false;
		}

		// check for cookie
		if( this.config.cookieTime === 0 ) {
			return false;
		}

		var cookieSet = document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + 'stb_box_' + this.id + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1") === "true";
		return cookieSet;

	};

	// disable the box
	Box.prototype.disable = function() {
		this.hide();
		this.setCookie();
		this.closed = true;
	};

	return Box;
})();
},{}],2:[function(require,module,exports){
module.exports = (function($) {
	'use strict';

	// Global Variables
	var boxes = {},
		windowHeight = window.innerHeight,
		scrollTimer = 0,
		resizeTimer = 0,
		overlay = document.getElementById('stb-overlay'),
		options = window.STB_Global_Options || {};

	var Box = require('./Box.js');

	// Functions

	// initialise & add event listeners
	function init() {
		$(".scroll-triggered-box").each(createBoxFromDOM);
		$(window).bind('scroll.stb', onScroll);
		$(window).bind('resize.stb', onWindowResize);
		$(document).keyup(onKeyUp);
		$(overlay).click(disableAllBoxes);

		if( options.testMode ) {
			console.log( 'Scroll Triggered Boxes: Test mode is enabled. Please disable test mode if you\'re done testing.' );
		}
	}

	// create a Box object from the DOM
	function createBoxFromDOM() {
		var $box = $(this);
		var id = parseInt(this.id.substring(4));
		var boxOptions = STB_Box_Options[id];
		boxOptions.element = this;
		boxOptions.$element = $box;
		boxOptions.testMode = options.testMode;
		boxes[boxOptions.id] = new Box(boxOptions);
	}

	function onWindowResize() {
		resizeTimer && clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(recalculateHeights, 100);
	}

	// "scroll" listener
	function onScroll() {
		scrollTimer && clearTimeout(scrollTimer);
		scrollTimer = window.setTimeout(checkBoxCriterias, 100);
	}

	// "keyup" listener
	function onKeyUp(e) {
		if (e.keyCode == 27) {
			disableAllBoxes();
		}
	}

	// hide and disable all registered boxes
	function disableAllBoxes() {
		for( var boxId in boxes ) {
			if( boxes[boxId].visible ) {
				boxes[boxId].disable();
			}
		}
	}

	// show all registered boxes
	function showAllBoxes() {
		for( var boxId in boxes ) {
			if( ! boxes[boxId].visible ) {
				boxes[boxId].show();
			}
		}
	}

	// hide all registered boxes
	function hideAllBoxes() {
		for( var boxId in boxes ) {
			if( boxes[boxId].visible ) {
				boxes[boxId].hide();
			}
		}
	}

	// check criteria for all registered boxes
	function checkBoxCriterias() {

		var scrollY = $(window).scrollTop();
		var scrollHeight = scrollY + ( windowHeight * 0.9 );

		for( var boxId in boxes ) {
			var box = boxes[boxId];

			if( ! box.mayAutoShow() ) {
				continue;
			}

			if( scrollHeight > box.triggerHeight ) {
				if( ! box.visible ) {
					box.show();
					box.triggered = true;
				}
			} else if( box.mayAutoHide() ) {
				if( box.visible ) {
					box.hide();
				}
			}
		}
	}

	// recalculate heights and variables based on height
	function recalculateHeights() {
		for( var boxId in boxes ) {
			var box = boxes[boxId];
			box.setCustomBoxStyling();
		}
	}

	// init on window.load
	$(window).load(init);

	// expose a simple API to control all registered boxes
	return {
		boxes: boxes,
		showBox: function(id) { boxes[id].show(); },
		hideBox: function(id) { boxes[id].hide(); },
		toggleBox: function(id) { boxes[id].toggle(); },
		showAllBoxes: showAllBoxes,
		hideAllBoxes: hideAllBoxes,
		disableAllBoxes: disableAllBoxes
	}

})(window.jQuery);
},{"./Box.js":1}],3:[function(require,module,exports){
window.STB = require('./STB.js');
},{"./STB.js":2}]},{},[1,2,3]);
