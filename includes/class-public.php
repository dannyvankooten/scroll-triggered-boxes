<?php
if( ! defined( 'STB::VERSION' ) ) {
	header( 'Status: 403 Forbidden' );
	header( 'HTTP/1.1 403 Forbidden' );
	exit;
}

class STB_Public {

	/**
	 * @var array
	 */
	private $matched_box_ids = array();

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'wp', array( $this, 'init' ) );
	}

	/**
	 * Initializes the plugin, runs on `wp` hook.
	 */
	public function init() {

		$this->matched_box_ids = $this->filter_boxes();

		// Only add other hooks if necessary
		if( count( $this->matched_box_ids ) > 0 ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'load_styles' ) );
			add_action( 'wp_footer', array( $this, 'output_boxes' ), 1 );

			add_filter( 'stb_content', 'wptexturize') ;
			add_filter( 'stb_content', 'convert_smilies' );
			add_filter( 'stb_content', 'convert_chars' );
			add_filter( 'stb_content', 'wpautop' );
			add_filter( 'stb_content', 'shortcode_unautop' );
			add_filter( 'stb_content', 'do_shortcode', 11 );
		}
	}

	/**
	 * Checks which boxes should be loaded for this request.
	 *
	 * @return array
	 */
	private function filter_boxes() {

		$matched_box_ids = array();
		$rules = get_option( 'stb_rules', false );

		if ( ! is_array( $rules ) ) {
			return array();
		}

		foreach ( $rules as $box_id => $box_rules ) {

			$matched = false;

			foreach ( $box_rules as $rule ) {

				$condition = $rule['condition'];
				$value = trim( $rule['value'] );

				if ( $condition !== 'manual' && $condition !== 'everywhere' ) {
					$value = array_filter( array_map( 'trim', explode( ',', $value ) ) );
				}

				switch ( $condition ) {
					case 'everywhere';
						$matched = true;
						break;

					case 'is_post_type':
						$matched = in_array( get_post_type(), $value );
						break;

					case 'is_single':
						$matched = is_single( $value );
						break;

					case 'is_page':
						$matched = is_page( $value );
						break;

					case 'is_not_page':
						$matched = !is_page( $value );
						break;

					case 'manual':
						// eval for now...
						$value = stripslashes(trim($value));
						$matched = eval( "return (" . $value . ");" );
						break;

				}

				// no need to run through the other rules
				// if criteria has already been met by this rule
				if( $matched ) {
					break;
				}
			}

			/**
			 * @filter stb_show_box
			 * @expects bool
			 * @param int $box_id
			 *
			 * Use to run some custom logic whether to show a box or not.
			 * Return true if box should be shown.
			 */
			$matched = apply_filters('stb_show_box', $matched, $box_id);

			// if matched, box should be loaded on this page
			if ( $matched ) {
				$matched_box_ids[] = $box_id;
			}

		}

		return $matched_box_ids;
	}

	/**
	* Load plugin styles
	*/
	public function load_styles() {
		$pre_suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		// stylesheets
		wp_register_style( 'scroll-triggered-boxes', STB::$url . 'assets/css/styles' . $pre_suffix . '.css', array(), STB::VERSION );

		// scripts
		wp_register_script( 'scroll-triggered-boxes', STB::$url . 'assets/js/script' . $pre_suffix . '.js' , array( 'jquery' ), STB::VERSION, true );

		// Finally, enqueue style.
		wp_enqueue_style( 'scroll-triggered-boxes' );
		wp_enqueue_script( 'scroll-triggered-boxes' );

		$this->pass_box_options();
	}

	/**
	 * Get an array of STB_Box objects. These are the boxes that will be loaded for the current request.
	 *
	 * @return array
	 */
	protected function get_matched_boxes() {
		static $boxes;

		if( is_null( $boxes ) ) {

			$boxes = array();
			foreach ( $this->matched_box_ids as $box_id ) {

				$box = get_post( $box_id );

				// has box with this id been found?
				if ( ! $box instanceof WP_Post || $box->post_status !== 'publish' ) {
					continue;
				}

				// add options property to box
				$box->options = STB::get_box_options( $box->ID );

				$boxes[] = $box;
			}
		}

		return $boxes;
	}

	/**
	 * Create array of Box options and pass it to JavaScript script.
	 */
	public function pass_box_options() {

		$boxes_options = array();

		foreach( $this->get_matched_boxes() as $box ) {

			// create array with box options
			$options = array(
				'id' => $box->ID,
				'trigger' => $box->options['trigger'],
				'triggerPercentage' => absint( $box->options['trigger_percentage'] ),
				'triggerElementSelector' => $box->options['trigger_element'],
				'animation' => $box->options['animation'],
				'cookeTime' => absint( $box->options['cookie'] ),
				'testMode' => (bool) $box->options['test_mode'],
				'autoHide' => (bool) $box->options['auto_hide'],
				'position' => $box->options['css']['position'],
				'minimumScreenWidth' => $this->get_minimum_screen_size_for_box( $box )
			);

			$boxes_options[ $box->ID ] = $options;
		}

		wp_localize_script( 'scroll-triggered-boxes', 'STB_Options', $boxes_options );
	}

	/**
	 * @param $box
	 *
	 * @return int
	 */
	protected function get_minimum_screen_size_for_box( $box ) {
		/**
		 * @filter stb_auto_hide_small_screens
		 * @expects bool
		 * @param int $box_id
		 * @deprecated 4.0 Use the hide_on_screen_size option instead
		 *
		 * Use to set whether the box should auto-hide on devices with a width smaller than 480px
		 */
		$auto_hide_small_screens = apply_filters('stb_auto_hide_small_screens', true, $box->ID );

		if( '' === $box->options['hide_on_screen_size'] && $auto_hide_small_screens ) {
			$minimum_screen_size = absint( $box->options['css']['width'] );
		} elseif( $box->options['hide_on_screen_size'] > 0 ) {
			$minimum_screen_size = absint( $box->options['hide_on_screen_size'] );
		} else {
			$minimum_screen_size = 0;
		}

		return $minimum_screen_size;
	}

	/**
	* Outputs the boxes in the footer
	*/
	public function output_boxes() {
		?><!-- Scroll Triggered Boxes v<?php echo STB::VERSION; ?> - https://wordpress.org/plugins/scroll-triggered-boxes/--><?php

		foreach ( $this->get_matched_boxes() as $box ) {

			$opts = $box->options;
			$css = $opts['css'];

			// run filters
			$content = apply_filters( 'stb_content', $box->post_content, $box );
			$minimum_screen_size = $this->get_minimum_screen_size_for_box( $box );
			$close_icon = apply_filters( 'stb_box_close_icon', '&times;', $box );
?>
			<style type="text/css">
				#stb-<?php echo $box->ID; ?> {
					background: <?php echo ( ! empty( $css['background_color'] ) ) ? esc_html( $css['background_color'] ) : 'white'; ?>;
					<?php if ( !empty( $css['color'] ) ) { ?>color: <?php echo esc_html( $css['color'] ); ?>;<?php } ?>
					<?php if ( !empty( $css['border_color'] ) && ! empty( $css['border_width'] ) ) { ?>border: <?php echo esc_html( $css['border_width'] ) . 'px' ?> solid <?php echo esc_html( $css['border_color'] ); ?>;<?php } ?>
					max-width: <?php echo ( !empty( $css['width'] ) ) ? absint( $css['width'] ) . 'px': 'auto'; ?>;
				}

				<?php if( $minimum_screen_size > 0 ) { ?>
					@media (max-width: <?php echo $minimum_screen_size; ?>px) {
						#stb-<?php echo $box->ID; ?> { display: none !important; }
					}
				<?php } ?>

				<?php do_action( 'stb_print_box_css', $box ); ?>
			</style>
			<div class="stb-container stb-<?php echo esc_attr( $opts['css']['position'] ); ?>-container">
				<div class="scroll-triggered-box stb stb-<?php echo esc_attr( $opts['css']['position'] ); ?>"
				     id="stb-<?php echo $box->ID; ?>"
				     style="display: none;">
					<div class="stb-content">
						<?php
						do_action( 'stb_print_box_content_before', $box );
						echo $content;
						do_action( 'stb_print_box_content_after', $box );
						?>
					</div>
					<span class="stb-close"><?php echo $close_icon; ?></span>
				</div></div>
			<?php
		}

			// print overlay element, we only need this once (it's re-used for all boxes)
			echo '<div id="stb-overlay"></div>';
		?><!-- / Scroll Triggered Box --><?php
	}


}