module.exports = (function($) {
	'use strict';

	var $optionControls = $("#stb-box-options-controls");
	var $manualTip = $optionControls.find('.stb-manual-tip');
	var EventEmitter = require('../EventEmitter.js');
	var events = new EventEmitter();
	var Option = require('./Option.js');
	var Designer = require('./Designer.js')($, Option, events);

	// events
	$optionControls.on('click', ".stb-add-rule", addRuleFields);
	$optionControls.on('click', ".stb-remove-rule", removeRule);
	$optionControls.on('change', ".stb-rule-condition", setContextualHelpers);
	$optionControls.find('.stb-auto-show-trigger').on('change', toggleTriggerOptions );
	$(window).load(function() {
		if( typeof(window.tinyMCE) === "undefined" ) {
			document.getElementById('notice-notinymce').style.display = 'block';
		}
	});

	// call contextual helper method for each row
	$('.stb-rule-row').each(setContextualHelpers);

	function toggleTriggerOptions() {
		$optionControls.find('.stb-trigger-options').toggle( this.value !== '' );
	}

	function removeRule() {
		$(this).parents('tr').remove();
	}

	function setContextualHelpers() {

		var $context;

		if( this.tagName === "TR" ) {
			$context = $(this);
		} else {
			$context = $(this).parents('tr');
		}

		var $condition = $context.find('.stb-rule-condition');

		// remove previously added helpers
		$context.find('.stb-helper').remove();

		var $valueInput = $context.find('.stb-rule-value');
		var $betterInput = $valueInput.clone().attr('name','').addClass('stb-helper').insertAfter($valueInput).show();
		$betterInput.change(function() {
			$valueInput.attr('value', $(this).val() );
		});
		$valueInput.hide();
		$manualTip.hide();

		// change placeholder for textual help
		switch($condition.val()) {
			case '':
			default:
				$betterInput.attr('placeholder', 'Leave empty to match anything or enter a comma-separated list of IDs or slugs');
				break;

			case 'everywhere':
				$valueInput.val('');
				$betterInput.hide();
				break;

			case 'is_single':
			case 'is_post':
				$betterInput.attr('placeholder', 'Leave empty to match any post or enter a comma-separated list of post IDs or slugs');
				$betterInput.suggest(ajaxurl + "?action=stb_autocomplete&post_type=post", {multiple:true, multipleSep: ","});
				break;

			case 'is_page':
				$betterInput.attr('placeholder', 'Leave empty to match any page or enter a comma-separated list of page IDs or slugs');
				$betterInput.suggest(ajaxurl + "?action=stb_autocomplete&post_type=page", {multiple:true, multipleSep: ","});
				break;

			case 'is_post_type':
				$betterInput.attr('placeholder', 'Enter a comma-separated list of post type names');
				break;

			case 'is_url':
				$betterInput.attr('placeholder', 'Enter a relative URL, eg /contact/');
				break;

			case 'manual':
				$betterInput.attr('placeholder', 'Example: is_single(1, 3)');
				$manualTip.show();
				break;
		}
	}

	function addRuleFields() {
		var $row = $optionControls.find(".stb-rule-row").last();
		var $newRow = $row.clone();
		$newRow.find('label').css({
			'text-align': 'right',
			'font-weight': 'normal'
		}).find('label').text("or");
		$newRow.insertAfter($row).find(":input").val('').each(function () {
			this.name = this.name.replace(/\[(\d+)\]/, function (str, p1) {
				return '[' + (parseInt(p1, 10) + 1) + ']';
			});
		}).trigger('change');
		return false;
	}

	return {
		'Designer': Designer,
		'Option': Option,
		'events': events
	};

})(window.jQuery);