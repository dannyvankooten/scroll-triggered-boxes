<?php

defined( 'ABSPATH' ) or exit;

/** @var \Boxzilla\Box $box */
/** @var array $opts */
/** @var array $global_opts */

/** @var array $rule_options */
$rule_options = array(
	'everywhere'          => __( 'everywhere', 'boxzilla' ),
	'is_page'             => __( 'if page', 'boxzilla' ),
	'is_single'           => __( 'if post', 'boxzilla' ),
	'is_post_with_tag'    => __( 'if post tag', 'boxzilla' ),
	'is_post_in_category' => __( 'if post category', 'boxzilla' ),
	'is_post_type'        => __( 'if post type', 'boxzilla' ),
	'is_url'              => __( 'if URL', 'boxzilla' ),
	'is_referer'          => __( 'if referer', 'boxzilla' ),
	'is_user_logged_in'   => __( 'if user', 'boxzilla' ),
);

/**
 * @ignore
 */
$rule_options = apply_filters( 'boxzilla_rules_options', $rule_options );

?>
<table class="form-table">
	<?php

	/**
	 * @ignore
	 */
	do_action( 'boxzilla_before_box_option_controls', $box, $opts );

	?>
	<tr>
		<th><?php _e( 'Load this box if', 'boxzilla' ); ?></th>
		<td>
			<label>
				<?php _e( 'Request matches', 'boxzilla' ); ?>
				<select name="boxzilla_box[rules_comparision]" id="boxzilla-rule-comparison">
					<option value="any" <?php selected( $opts['rules_comparision'], 'any' ); ?>><?php _e( 'any', 'boxzilla' ); ?></option>
					<option value="all" <?php selected( $opts['rules_comparision'], 'all' ); ?>><?php _e( 'all', 'boxzilla' ); ?></option>
				</select>
				<?php _e( 'of the following conditions.', 'boxzilla' ); ?>
			</label>
		</td>
	</tr>
	<tbody id="boxzilla-box-rules">
	<?php
	$key = 0;
	foreach ( $opts['rules'] as $rule ) {
		// skip invalid looking rules
		if ( ! array_key_exists( 'condition', $rule ) ) {
			continue;
		}

		// output row showing "and" or "or" between rules
		if ( $key > 0 ) {
			$or   = __( 'or', 'boxzilla' );
			$and  = __( 'and', 'boxzilla' );
			$text = $opts['rules_comparision'] === 'any' ? $or : $and;

			echo '<tr>';
			echo '<th class="boxzilla-no-vpadding"></th>';
			echo '<td class="boxzilla-no-vpadding"><span class="boxzilla-andor boxzilla-muted">' . $text . '</span></td>';
			echo '</tr>';
		}
		?>
		<tr valign="top" class="boxzilla-rule-row boxzilla-rule-row-<?php echo $key; ?>">
			<th style="text-align: right; font-weight: normal;">
				<span class="boxzilla-close boxzilla-remove-rule" title="<?php esc_attr_e( 'Remove rule', 'boxzilla' ); ?>"><span class="dashicons dashicons-dismiss"></span></span>
			</th>
			<td>
				<select class="boxzilla-rule-condition" name="boxzilla_box[rules][<?php echo $key; ?>][condition]">
					<?php
					foreach ( $rule_options as $value => $label ) {
						printf( '<option value="%s" %s>%s</option>', $value, selected( $rule['condition'], $value ), $label );
					}
					?>
				</select>

				<select class="boxzilla-rule-qualifier" name="boxzilla_box[rules][<?php echo $key; ?>][qualifier]" style="min-width: 135px;">
					<option value="1" <?php selected( ! isset( $rule['qualifier'] ) || $rule['qualifier'] ); ?>><?php _e( 'is', 'boxzilla' ); ?></option>
					<option value="0" <?php selected( isset( $rule['qualifier'] ) && ! $rule['qualifier'] ); ?>><?php _e( 'is not', 'boxzilla' ); ?></option>
					<option value="contains" <?php selected( isset( $rule['qualifier'] ) && $rule['qualifier'] === 'contains' ); ?> style="display: none;"><?php _e( 'contains', 'boxzilla' ); ?>
					<option value="not_contains" <?php selected( isset( $rule['qualifier'] ) && $rule['qualifier'] === 'not_contains' ); ?> style="display: none;"><?php _e( 'does not contain', 'boxzilla' ); ?></option>
				</select>

				<input class="boxzilla-rule-value regular-text" name="boxzilla_box[rules][<?php echo $key; ?>][value]" type="text" value="<?php echo esc_attr( $rule['value'] ); ?>" placeholder="<?php _e( 'Leave empty for any or enter (comma-separated) names or ID\'s', 'boxzilla' ); ?>" style="<?php echo in_array( $rule['condition'], array( '', 'everywhere' ), true ) ? 'display: none;' : ''; ?>" />
			</td>
		</tr>
		<?php
		$key++;
	}
	?>
	</tbody>
	<tr>
		<th></th>
		<td><button type="button" class="button boxzilla-add-rule"><?php _e( 'Add another rule', 'boxzilla' ); ?></button></td>
	</tr>
	<tr valign="top">
		<th><label for="boxzilla_position"><?php _e( 'Box Position', 'boxzilla' ); ?></label></th>
		<td>
			<table class="window-positions">
				<tr>
					<td>
						<?php
						$value = 'top-left';
						$label = __( 'Top Left', 'boxzilla' );
						printf( '<label><input type="radio" name="boxzilla_box[css][position]" value="%s" %s> &nbsp; %s</label>', $value, checked( $opts['css']['position'], $value, false ), $label );
						?>
					</td>
					<td></td>
					<td>
						<?php
						$value = 'top-right';
						$label = __( 'Top Right', 'boxzilla' );
						printf( '<label><input type="radio" name="boxzilla_box[css][position]" value="%s" %s> &nbsp; %s</label>', $value, checked( $opts['css']['position'], $value, false ), $label );
						?>
					</td>
				</tr>
				<tr>
					<td></td>
					<td>
						<?php
						$value = 'center';
						$label = __( 'Center', 'boxzilla' );
						printf( '<label><input type="radio" name="boxzilla_box[css][position]" value="%s" %s> &nbsp; %s</label>', $value, checked( $opts['css']['position'], $value, false ), $label );
						?>
					</td>
					<td></td>
				</tr>
				<tr>
					<td>
						<?php
						$value = 'bottom-left';
						$label = __( 'Bottom Left', 'boxzilla' );
						printf( '<label><input type="radio" name="boxzilla_box[css][position]" value="%s" %s> &nbsp; %s</label>', $value, checked( $opts['css']['position'], $value, false ), $label );
						?>
					</td>
					<td></td>
					<td>
						<?php
						$value = 'bottom-right';
						$label = __( 'Bottom Right', 'boxzilla' );
						printf( '<label><input type="radio" name="boxzilla_box[css][position]" value="%s" %s> &nbsp; %s</label>', $value, checked( $opts['css']['position'], $value, false ), $label );
						?>
					</td>
				</tr>
			</table>
		</td>
	</tr>
	<tr valign="top">
		<th><label><?php _e( 'Animation', 'boxzilla' ); ?></label></th>
		<td>
			<label><input type="radio" name="boxzilla_box[animation]" value="fade" <?php checked( $opts['animation'], 'fade' ); ?> /> <?php _e( 'Fade In', 'boxzilla' ); ?></label> &nbsp;
			<label><input type="radio" name="boxzilla_box[animation]" value="slide" <?php checked( $opts['animation'], 'slide' ); ?> /> <?php _e( 'Slide In', 'boxzilla' ); ?></label>
			<p class="help"><?php _e( 'Which animation type should be used to show the box when triggered?', 'boxzilla' ); ?></p>
		</td>
	</tr>
	<tr valign="top">
		<th><label for="boxzilla_trigger"><?php _e( 'Auto-show box?', 'boxzilla' ); ?></label></th>
		<td>
			<label><input type="radio" class="boxzilla-auto-show-trigger" name="boxzilla_box[trigger]" value="" <?php checked( $opts['trigger'], '' ); ?> /> <?php _e( 'Never', 'boxzilla' ); ?></label><br />
			<label><input type="radio" class="boxzilla-auto-show-trigger" name="boxzilla_box[trigger]" value="time_on_page" <?php checked( $opts['trigger'], 'time_on_page' ); ?> /> <?php printf( __( 'Yes, after %s seconds on the page.', 'boxzilla' ), '<input type="number" name="boxzilla_box[trigger_time_on_page]" min="0" value="' . esc_attr( $opts['trigger_time_on_page'] ) . '" />' ); ?></label><br />
			<label><input type="radio" class="boxzilla-auto-show-trigger" name="boxzilla_box[trigger]" value="percentage" <?php checked( $opts['trigger'], 'percentage' ); ?> /> <?php printf( __( 'Yes, when at %s of page height', 'boxzilla' ), '<input type="number" name="boxzilla_box[trigger_percentage]" min="0" max="100" value="' . esc_attr( $opts['trigger_percentage'] ) . '" />%' ); ?></label><br />
			<label><input type="radio" class="boxzilla-auto-show-trigger" name="boxzilla_box[trigger]" value="element" <?php checked( $opts['trigger'], 'element' ); ?> /> <?php printf( __( 'Yes, when at element %s', 'boxzilla' ), '<input type="text" name="boxzilla_box[trigger_element]" value="' . esc_attr( $opts['trigger_element'] ) . '" placeholder="' . __( 'Example: #comments', 'boxzilla' ) . '" />' ); ?></label><br />
			<?php do_action( 'boxzilla_output_auto_show_trigger_options', $opts ); ?>
		</td>
	</tr>
	<tbody class="boxzilla-trigger-options" style="display: <?php echo ( $opts['trigger'] === '' ) ? 'none' : 'table-row-group'; ?>;">
	<tr valign="top">
		<th><label for="boxzilla_cookie"><?php _e( 'Cookie expiration', 'boxzilla' ); ?></label></th>
		<td>
			<div style="display: inline-block; margin-right: 20px;">
				<label for="boxzilla_cookie_triggered" style="font-weight: bold; display: block;"><?php esc_html_e( 'Triggered', 'boxzilla' ); ?></label>
				<input type="number" id="boxzilla_cookie_triggered" name="boxzilla_box[cookie][triggered]" min="0" step="1" value="<?php echo esc_attr( $opts['cookie']['triggered'] ); ?>" />
				<small><?php _e( 'hours', 'boxzilla' ); ?></small>
			</div>
			<div style="display: inline-block;">
				<label for="boxzilla_cookie_dismissed" style="font-weight: bold; display: block;"><?php esc_html_e( 'Dismissed', 'boxzilla' ); ?></label>
				<input type="number" id="boxzilla_cookie_dismissed" name="boxzilla_box[cookie][dismissed]" min="0" step="1" value="<?php echo esc_attr( $opts['cookie']['dismissed'] ); ?>" />
				<small><?php _e( 'hours', 'boxzilla' ); ?></small>
			</div>
			<br />

			<p class="help"><?php _e( 'After this box is triggered or dismissed, how many hours should it stay hidden?', 'boxzilla' ); ?></p>
		</td>
	</tr>
	<tr valign="top">
		<th><label><?php _e( 'Screen width', 'boxzilla' ); ?></label></th>
		<td>
			<?php
			$condition_type   = $opts['screen_size_condition']['condition'];
			$condition_value  = $opts['screen_size_condition']['value'];
			$condition_select = '<select name="boxzilla_box[screen_size_condition][condition]"><option value="larger" ' . ( $condition_type === 'larger' ? 'selected' : '' ) . '>' . __( 'larger', 'boxzilla' ) . '</option><option value="smaller" ' . ( $condition_type === 'smaller' ? 'selected' : '' ) . '>' . __( 'smaller', 'boxzilla' ) . '</option></select>';
			?>
			<p><?php printf( __( 'Only show on screens %1$s than %2$s.', 'boxzilla' ), $condition_select, '<input type="number" min="0" name="boxzilla_box[screen_size_condition][value]" value="' . esc_attr( $condition_value ) . '" style="max-width: 70px;" />px' ); ?></p>
			<p class="help"><?php _e( 'Leave empty if you want to show the box on all screen sizes.', 'boxzilla' ); ?></p>
		</td>
a
	</tr>
	<?php if ( in_array( $opts['trigger'], array( 'element', 'percentage' ) ) ) { ?>
	<tr valign="top">
		<th><label for="boxzilla_auto_hide"><?php _e( 'Auto-hide on scroll-up?', 'boxzilla' ); ?></label></th>
		<td>
			<label><input type="radio" name="boxzilla_box[auto_hide]" value="1" <?php checked( $opts['auto_hide'], 1 ); ?> /> <?php _e( 'Yes', 'boxzilla' ); ?></label> &nbsp;
			<label><input type="radio" name="boxzilla_box[auto_hide]" value="0" <?php checked( $opts['auto_hide'], 0 ); ?> /> <?php _e( 'No', 'boxzilla' ); ?></label> &nbsp;
			<p class="help"><?php _e( 'Hide box again when visitors scroll back up?', 'boxzilla' ); ?></p><br></td>
	</tr>
	<tr valign="top">
		<th><label for="boxzilla_auto_hide"><?php _e( 'Auto-hide on scroll?', 'boxzilla' ); ?></label></th>
		<td>
			<label><input type="radio" class="boxzilla-auto-hide-trigger" name="boxzilla_box[trigger_hide]" value="" <?php checked( $opts['trigger_hide'], '' ); ?> /> <?php _e( 'Never', 'boxzilla' ); ?></label><br />
			<label><input type="radio" class="boxzilla-auto-hide-trigger" name="boxzilla_box[trigger_hide]" value="percentage" <?php checked( $opts['trigger_hide'], 'percentage' ); ?> /> <?php printf( __( 'Yes, when at %s of page height', 'boxzilla' ), '<input type="number" name="boxzilla_box[trigger_hide_percentage]" min="0" max="100" value="' . esc_attr( $opts['trigger_hide_percentage'] ) . '" />%' ); ?></label><br />
			<label><input type="radio" class="boxzilla-auto-hide-trigger" name="boxzilla_box[trigger_hide]" value="element" <?php checked( $opts['trigger_hide'], 'element' ); ?> /> <?php printf( __( 'Yes, when at element %s', 'boxzilla' ), '<input type="text" name="boxzilla_box[trigger_hide_element]" value="' . esc_attr( $opts['trigger_hide_element'] ) . '" placeholder="' . __( 'Example: #comments', 'boxzilla' ) . '" />' ); ?></label><br />
		</td>
	</tr>
	<?php } // end if ?>
	</tbody>
	<tbody>
	<tr valign="top">
		<th><label for="boxzilla_closable"><?php _e( 'Show close icon?', 'boxzilla' ); ?></label></th>
		<td>
			<label><input type="radio" id="boxzilla_closable_1" name="boxzilla_box[show_close_icon]" value="1" <?php checked( $opts['show_close_icon'], 1 ); ?> /> <?php _e( 'Yes', 'boxzilla' ); ?></label> &nbsp;
			<label><input type="radio" id="boxzilla_closable_0" name="boxzilla_box[show_close_icon]" value="0" <?php checked( $opts['show_close_icon'], 0 ); ?> /> <?php _e( 'No', 'boxzilla' ); ?></label> &nbsp;
			<p class="help">
				<?php _e( 'If you decide to hide the close icon, make sure to offer an alternative way to close the box.', 'boxzilla' ); ?><br />
				<?php _e( 'Example: ', 'boxzilla' ); ?> <code>[boxzilla-close]No, thanks![/boxzilla-close]</code>
			</p>
		</td>
	</tr>
	<tr valign="top">
		<th><label for="boxzilla_test_mode"><?php _e( 'Enable test mode?', 'boxzilla' ); ?></label></th>
		<td>
			<label><input type="radio" id="boxzilla_test_mode_1" name="boxzilla_global_settings[test_mode]" value="1" <?php checked( $global_opts['test_mode'], 1 ); ?> /> <?php _e( 'Yes', 'boxzilla' ); ?></label> &nbsp;
			<label><input type="radio" id="boxzilla_test_mode_0" name="boxzilla_global_settings[test_mode]" value="0" <?php checked( $global_opts['test_mode'], 0 ); ?> /> <?php _e( 'No', 'boxzilla' ); ?></label> &nbsp;
			<p class="help"><?php _e( 'If test mode is enabled, all boxes will show up regardless of whether a cookie has been set.', 'boxzilla' ); ?></p>
		</td>
	</tr>
	<?php

	/**
	 * @ignore
	 */
	do_action( 'boxzilla_after_box_option_controls', $box, $opts );
	?>
	</tbody>
</table>


<script type="text/html" id="tmpl-rule-row-template">
	<tr>
		<th class="boxzilla-no-vpadding"></th>
		<td class="boxzilla-no-vpadding"><span class="boxzilla-andor boxzilla-muted">{{data.andor}}</span></td>
	</tr>
	<tr valign="top" class="boxzilla-rule-row boxzilla-rule-row-{{{data.key}}}">
		<th style="text-align: right; font-weight: normal;">
			<span class="boxzilla-close boxzilla-remove-rule" title="<?php esc_attr_e( 'Remove rule', 'boxzilla' ); ?>"><span class="dashicons dashicons-dismiss"></span></span>
		</th>
		<td class="boxzilla-sm">
			<select class="boxzilla-rule-condition" name="boxzilla_box[rules][{{{data.key}}}][condition]">
				<?php
				foreach ( $rule_options as $value => $label ) {
					printf( '<option value="%s" %s %s>%s</option>', $value, disabled( $value, '', false ), '', $label );
				}
				?>
			</select>
			<select class="boxzilla-rule-qualifier" name="boxzilla_box[rules][{{{data.key}}}][qualifier]" style="display: none; min-width: 135px;" >
				<option value="1" selected><?php _e( 'is', 'boxzilla' ); ?></option>
				<option value="0"><?php _e( 'is not', 'boxzilla' ); ?></option>
				<option value="contains" style="display: none;"><?php _e( 'contains', 'boxzilla' ); ?></option>
				<option value="not_contains" style="display: none;"><?php _e( 'does not contain', 'boxzilla' ); ?></option>
			</select>

			<input class="boxzilla-rule-value regular-text" name="boxzilla_box[rules][{{{data.key}}}][value]" type="text" value="" placeholder="<?php _e( 'Leave empty for any or enter (comma-separated) names or ID\'s', 'boxzilla' ); ?>" style="display: none;" />
		</td>
	</tr>
</script>
