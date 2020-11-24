<?php

namespace Boxzilla\Admin;

use Boxzilla\Plugin;
use Boxzilla\Box;
use Boxzilla\Boxzilla;
use WP_Post;
use WP_Screen;

class Admin {


	/**
	 * @var Plugin $plugin
	 */
	private $plugin;

	/**
	 * @var Boxzilla
	 */
	protected $boxzilla;

	/**
	 * @var ReviewNotice
	 */
	protected $review_notice;

	/**
	 * @param Plugin $plugin
	 * @param Boxzilla $boxzilla
	 */
	public function __construct( Plugin $plugin, Boxzilla $boxzilla ) {
		$this->plugin        = $plugin;
		$this->boxzilla      = $boxzilla;
		$this->review_notice = new ReviewNotice();
	}

	/**
	 * Initialise the all admin related stuff
	 */
	public function init() {
		$this->add_hooks();
		$this->run_migrations();
		$this->review_notice->init();
	}

	/**
	 * Add necessary hooks
	 */
	protected function add_hooks() {
		add_action( 'admin_init', array( $this, 'lazy_add_hooks' ) );
		add_action( 'admin_init', array( $this, 'register' ) );
		add_action( 'init', array( $this, 'listen_for_actions' ) );
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_notices', array( $this, 'notices' ) );
		add_action( 'save_post_boxzilla-box', array( $this, 'save_box_options' ), 20, 2 );
		add_action( 'trashed_post', array( $this, 'flush_rules' ) );
		add_action( 'untrashed_post', array( $this, 'flush_rules' ) );
		add_filter( 'bulk_actions-edit-boxzilla-box', array( $this, 'bulk_action_add' ) );
		add_filter( 'handle_bulk_actions-edit-boxzilla-box', array( $this, 'bulk_action_handle' ), 10, 3 );

	}

	/**
	 * Listen for admin actions.
	 */
	public function listen_for_actions() {
		// triggered?
		$vars = array_merge( $_POST, $_GET );
		if ( empty( $vars['_boxzilla_admin_action'] ) ) {
			return false;
		}

		// authorized?
		if ( ! current_user_can( 'edit_posts' ) ) {
			return false;
		}

		// fire action
		$action = $vars['_boxzilla_admin_action'];
		do_action( 'boxzilla_admin_' . $action );

		return true;
	}

	public function bulk_action_add( $bulk_actions ) {
		$bulk_actions['boxzilla_duplicate_box'] = __( 'Duplicate box', 'boxzilla' );
		return $bulk_actions;
	}

	public function bulk_action_handle( $redirect_to, $doaction, $post_ids ) {
		if ( $doaction !== 'boxzilla_duplicate_box' || empty( $post_ids ) ) {
			return $redirect_to;
		}

		foreach ( $post_ids as $post_id ) {
			$post = get_post( $post_id );
			if ( $post->post_type !== 'boxzilla-box' ) {
				continue;
			}

			$new_post_id = wp_insert_post(
				array(
					'post_type'    => $post->post_type,
					'post_title'   => $post->post_title,
					'post_content' => $post->post_content,
					'post_status'  => 'draft',
				)
			);

			$options = get_post_meta( $post_id, 'boxzilla_options', true );
			add_post_meta( $new_post_id, 'boxzilla_options', $options );

			$this->flush_rules( $new_post_id );
		}

		return $redirect_to;
	}

	/**
	 * All logic for admin notices lives here.
	 */
	public function notices() {
		global $pagenow,
			   $current_screen;

		if ( ( $pagenow === 'plugins.php' || ( $current_screen && $current_screen->post_type === 'boxzilla-box' ) )
			&& current_user_can( 'install_plugins' )
			&& is_plugin_active( 'scroll-triggered-boxes/index.php' ) ) {
			$url = wp_nonce_url( 'plugins.php?action=deactivate&plugin=scroll-triggered-boxes/index.php', 'deactivate-plugin_' . 'scroll-triggered-boxes/index.php' ); ?>
			<div class="notice notice-info">
				<p><?php printf( __( 'Awesome, you are using Boxzilla! You can now safely <a href="%s">deactivate the Scroll Triggered Boxes plugin</a>.', 'boxzilla' ), $url ); ?></p>
			</div>
			<?php
		}
	}

	/**
	 * Checks current version against stored version & runs necessary update routines.
	 *
	 * @return bool
	 */
	protected function run_migrations() {

		// Only run if db option is at older version than code constant
		$previous_version = get_option( 'boxzilla_version', '0' );
		$current_version  = $this->plugin->version();

		if ( version_compare( $current_version, $previous_version, '<=' ) ) {
			return false;
		}

		$upgrade_routines = new Migrations( $previous_version, $current_version, __DIR__ . '/migrations' );
		$upgrade_routines->run();
		update_option( 'boxzilla_version', $current_version );
	}

	public function lazy_add_hooks() {
		global $pagenow;

		add_action( 'admin_enqueue_scripts', array( $this, 'load_assets' ) );
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
		add_filter( 'tiny_mce_before_init', array( $this, 'tinymce_init' ) );
		add_filter( 'manage_edit-boxzilla-box_columns', array( $this, 'post_type_column_titles' ) );
		add_action( 'manage_boxzilla-box_posts_custom_column', array( $this, 'post_type_column_content' ), 10, 2 );
		add_filter( 'admin_footer_text', array( $this, 'admin_footer_text' ) );

		if ( $pagenow === 'plugins.php' ) {
			add_filter( 'plugin_action_links', array( $this, 'add_plugin_settings_link' ), 10, 2 );
			add_filter( 'plugin_row_meta', array( $this, 'add_plugin_meta_links' ), 10, 2 );
		}
	}

	/**
	 * @param $post_id
	 */
	public function post_type_column_box_id_content( $post_id ) {
		echo $post_id;
	}

	/**
	 * @param $column
	 * @param $post_id
	 */
	public function post_type_column_content( $column, $post_id ) {
		$method_name = 'post_type_column_' . $column . '_content';
		if ( method_exists( $this, $method_name ) ) {
			call_user_func( array( $this, $method_name ), $post_id );
		}
	}

	/**
	 * @param $columns
	 *
	 * @return mixed
	 */
	public function post_type_column_titles( $columns ) {
		$columns = self::array_insert(
			$columns,
			array(
				'box_id' => __( 'Box ID', 'boxzilla' ),
			),
			1
		);

		$columns['title'] = __( 'Box Title', 'boxzilla' );

		return $columns;
	}

	/**
	 * Register stuffs
	 */
	public function register() {

		// register settings
		register_setting( 'boxzilla_settings', 'boxzilla_settings', array( $this, 'sanitize_settings' ) );

		// register scripts
		$pre_suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_register_script(
			'boxzilla-admin',
			$this->plugin->url( '/assets/js/admin-script' . $pre_suffix . '.js' ),
			array(
				'jquery',
				'wp-util',
				'wp-color-picker',
				'suggest',
			),
			$this->plugin->version(),
			true
		);

		// load stylesheets
		wp_register_style( 'boxzilla-admin', $this->plugin->url( '/assets/css/admin-styles' . $pre_suffix . '.css' ), array(), $this->plugin->version() );
	}

	/**
	 * Renders the STB Menu items
	 */
	public function menu() {
		$menu_items = array(
			array(
				__( 'Settings', 'boxzilla' ),
				__( 'Settings', 'boxzilla' ),
				'boxzilla-settings',
				array( $this, 'show_settings_page' ),
			),
			array(
				__( 'Extensions', 'boxzilla' ),
				'<span style="color: orange">' . __( 'Extensions', 'boxzilla' ) . '</span>',
				'boxzilla-extensions',
				array( $this, 'show_extensions_page' ),
			),
		);

		$menu_items = apply_filters( 'boxzilla_admin_menu_items', $menu_items );

		foreach ( $menu_items as $item ) {
			add_submenu_page( 'edit.php?post_type=boxzilla-box', $item[0] . '- Boxzilla', $item[1], 'manage_options', $item[2], $item[3] );
		}
	}

	/**
	 * Shows the settings page
	 */
	public function show_settings_page() {
		$opts = $this->boxzilla->options;
		require __DIR__ . '/views/settings.php';
	}

	/**
	 * Shows the extensions page
	 */
	public function show_extensions_page() {
		$extensions = $this->fetch_extensions();
		require __DIR__ . '/views/extensions.php';
	}

	/**
	 * Are we currently editing a box?
	 *
	 * @return bool
	 */
	protected function on_edit_box_page() {
		global $pagenow;

		if ( ! in_array( $pagenow, array( 'post-new.php', 'post.php' ), true ) ) {
			return false;
		}

		if ( isset( $_GET['post_type'] ) && $_GET['post_type'] === 'boxzilla-box' ) {
			return true;
		}

		if ( get_post_type() === 'boxzilla-box' ) {
			return true;
		}

		return false;
	}

	/**
	 * @param $args
	 *
	 * @return mixed
	 */
	public function tinymce_init( $args ) {

		// only act on our post type
		if ( get_post_type() !== 'boxzilla-box' ) {
			return $args;
		}

		$args['setup'] = 'function( editor ) { if(typeof(window.Boxzilla_Admin) === \'undefined\') { return; } editor.on("PreInit", window.Boxzilla_Admin.Designer.init ); }';

		return $args;
	}

	/**
	 * Load plugin assets
	 */
	public function load_assets() {
		$screen = get_current_screen();

		if ( ! $screen instanceof WP_Screen ) {
			return false;
		}

		if ( $screen->base === 'edit' && $screen->post_type === 'boxzilla-box' ) {
			wp_enqueue_style( 'boxzilla-admin' );
		}

		if ( $screen->base === 'post' && $screen->post_type === 'boxzilla-box' ) {
			// color picker
			wp_enqueue_style( 'wp-color-picker' );

			// load scripts
			wp_enqueue_script( 'boxzilla-admin' );

			$data = array(
				'and'                             => __( 'and', 'boxzilla' ),
				'or'                              => __( 'or', 'boxzilla' ),
				'enterCommaSeparatedValues'       => __( 'Enter a comma-separated list of values.', 'boxzilla' ),
				'enterCommaSeparatedPosts'        => __( "Enter a comma-separated list of post slugs or post ID's..", 'boxzilla' ),
				'enterCommaSeparatedPages'        => __( "Enter a comma-separated list of page slugs or page ID's..", 'boxzilla' ),
				'enterCommaSeparatedPostTypes'    => __( 'Enter a comma-separated list of post types..', 'boxzilla' ),
				'enterCommaSeparatedRelativeUrls' => __( "Enter a comma-separated list of relative URL's, eg /contact/", 'boxzilla' ),
			);
			wp_localize_script( 'boxzilla-admin', 'boxzilla_i18n', $data );

			// load stylesheets
			wp_enqueue_style( 'boxzilla-admin' );

			// allow add-ons to easily load their own scripts or stylesheets
			do_action( 'boxzilla_load_admin_assets' );
		}

		if ( isset( $_GET['page'] ) && $_GET['page'] === 'boxzilla-settings' ) {
			wp_enqueue_style( 'boxzilla-admin' );
		}
	}

	/**
	 * Register meta boxes
	 *
	 * @param string $post_type
	 *
	 * @return bool
	 */
	public function add_meta_boxes( $post_type ) {
		if ( $post_type !== 'boxzilla-box' ) {
			return false;
		}

		add_meta_box(
			'boxzilla-box-appearance-controls',
			__( 'Box Appearance', 'boxzilla' ),
			array( $this, 'metabox_box_appearance_controls' ),
			'boxzilla-box',
			'normal',
			'core'
		);

		add_meta_box(
			'boxzilla-box-options-controls',
			__( 'Box Options', 'boxzilla' ),
			array( $this, 'metabox_box_option_controls' ),
			'boxzilla-box',
			'normal',
			'core'
		);

		add_meta_box(
			'boxzilla-support',
			__( 'Looking for help?', 'boxzilla' ),
			array( $this, 'metabox_support' ),
			'boxzilla-box',
			'side'
		);

		add_meta_box(
			'boxzilla-our-other-plugins',
			__( 'Our other plugins', 'boxzilla' ),
			array( $this, 'metabox_our_other_plugins' ),
			'boxzilla-box',
			'side'
		);

		add_meta_box(
			'boxzilla-email-optin',
			__( 'Subscribe to our newsletter', 'boxzilla' ),
			array( $this, 'metabox_email_optin' ),
			'boxzilla-box',
			'side'
		);

		return true;
	}

	/**
	 * @param \WP_Post $post
	 * @param          $metabox
	 */
	public function metabox_box_appearance_controls( \WP_Post $post, $metabox ) {

		// get box options
		$box  = new Box( $post );
		$opts = $box->get_options();

		// include view
		include __DIR__ . '/views/metaboxes/box-appearance-controls.php';
	}

	/**
	 * @param \WP_Post $post
	 * @param          $metabox
	 */
	public function metabox_box_option_controls( \WP_Post $post, $metabox ) {

		// get box options
		$box         = new Box( $post );
		$opts        = $box->get_options();
		$global_opts = $this->boxzilla->options;

		if ( empty( $opts['rules'] ) ) {
			$opts['rules'][] = array(
				'condition' => '',
				'qualifier' => 1,
				'value'     => '',
			);
		}

		// include view
		include __DIR__ . '/views/metaboxes/box-option-controls.php';
	}

	/**
	 * @param \WP_Post $post
	 * @param          $metabox
	 */
	public function metabox_email_optin( \WP_Post $post, $metabox ) {
		include __DIR__ . '/views/metaboxes/email-optin.php';
	}

	/**
	 * @param \WP_Post $post
	 * @param          $metabox
	 */
	public function metabox_our_other_plugins( \WP_Post $post, $metabox ) {
		include __DIR__ . '/views/metaboxes/our-other-plugins.php';
	}

	/**
	 * @param \WP_Post $post
	 * @param          $metabox
	 */
	public function metabox_support( \WP_Post $post, $metabox ) {
		include __DIR__ . '/views/metaboxes/need-help.php';
	}


	/**
	 * Saves box options and rules
	 *
	 * @param int $box_id
	 *
	 * @return bool
	 */
	public function save_box_options( $box_id, $post ) {

		// Only act on our own post type
		if ( $post->post_type !== 'boxzilla-box' ) {
			return false;
		}

		// is this a revision save?
		if ( wp_is_post_revision( $box_id ) || ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) ) {
			return false;
		}

		// can user edit this post?
		if ( ! current_user_can( 'edit_post', $box_id ) ) {
			return false;
		}

		// make sure options array is set
		if ( ! isset( $_POST['boxzilla_box'] ) || ! is_array( $_POST['boxzilla_box'] ) ) {
			return false;
		}

		// get new options from $_POST
		$opts = $this->sanitize_box_options( $_POST['boxzilla_box'] );

		// allow extensions to filter the saved options
		$opts = apply_filters( 'boxzilla_saved_options', $opts, $box_id );

		// save individual box settings
		update_post_meta( $box_id, 'boxzilla_options', $opts );

		// update global settings if given
		if ( ! empty( $_POST['boxzilla_global_settings'] ) ) {
			$global_settings = get_option( 'boxzilla_settings', array() );
			if ( ! is_array( $global_settings ) ) {
				$global_settings = array();
			}
			$global_settings = array_merge( $global_settings, $_POST['boxzilla_global_settings'] );
			update_option( 'boxzilla_settings', $global_settings );
		}

		$this->flush_rules( $box_id );

		return true;
	}

	/**
	 * @param array $opts
	 *
	 * @return array
	 */
	public function sanitize_settings( $opts ) {
		return $opts;
	}

	/**
	 * @param string $url_string
	 *
	 * @return string
	 */
	public function sanitize_url( $url_string ) {

		// if empty, just return a slash
		if ( empty( $url_string ) ) {
			return '/';
		}

		// if string looks like an absolute URL, extract just the path
		if ( preg_match( '/^((https|http)?\:\/\/)?(\w+\.)?\w+\.\w+\.*/i', $url_string ) ) {

			// make sure URL has scheme prepended, to make parse_url() understand..
			$url_string = 'https://' . str_replace( array( 'http://', 'https://' ), '', $url_string );

			// get just the path
			$url_string = parse_url( $url_string, PHP_URL_PATH );
		}

		// leading slash it
		return $url_string;
	}

	/**
	 * @param array $rule
	 * @return array The sanitized rule array
	 */
	public function sanitize_box_rule( $rule ) {
		$rule['value'] = trim( $rule['value'] );

		// convert to array
		$rule['value'] = explode( ',', trim( $rule['value'], ',' ) );

		// trim all whitespace in value field
		$rule['value'] = array_map( 'trim', $rule['value'] );

		// Make sure "is_url" values have a leading slash
		if ( $rule['condition'] === 'is_url' ) {
			$rule['value'] = array_map( array( $this, 'sanitize_url' ), $rule['value'] );
		}

		// (re)set value to 0 when condition is everywhere
		if ( $rule['condition'] === 'everywhere' ) {
			$rule['value'] = '';
		}

		// convert back to string before saving
		if ( is_array( $rule['value'] ) ) {
			$rule['value'] = join( ',', $rule['value'] );
		}

		return $rule;
	}

	/**
	 * @param array $css
	 * @return array
	 */
	public function sanitize_box_css( $css ) {

		// sanitize settings
		if ( '' !== $css['width'] ) {
			$css['width'] = absint( $css['width'] );
		}

		if ( '' !== $css['border_width'] ) {
			$css['border_width'] = absint( $css['border_width'] );
		}

		// make sure colors start with `#`
		$color_keys = array( 'color', 'background_color', 'border_color' );
		foreach ( $color_keys as $key ) {
			$value = $css[ $key ];
			$color = sanitize_text_field( $value );

			// make sure color starts with `#`
			if ( '' !== $color && $color[0] !== '#' ) {
				$color = '#' . $color;
			}
			$css[ $key ] = $color;
		}

		return $css;
	}

	/**
	 * Sanitize the options for this box.
	 *
	 * @param array $opts
	 *
	 * @return array
	 */
	protected function sanitize_box_options( $opts ) {
		$defaults = array(
			'rules' => array(),
			'css'   => array(),
		);

		$opts = array_replace_recursive( $defaults, $opts );

		$opts['rules']                          = array_map( array( $this, 'sanitize_box_rule' ), $opts['rules'] );
		$opts['css']                            = $this->sanitize_box_css( $opts['css'] );
		$opts['cookie']['triggered']            = absint( $opts['cookie']['triggered'] );
		$opts['cookie']['dismissed']            = absint( $opts['cookie']['dismissed'] );
		$opts['trigger']                        = sanitize_text_field( $opts['trigger'] );
		$opts['trigger_percentage']             = absint( $opts['trigger_percentage'] );
		$opts['trigger_element']                = sanitize_text_field( $opts['trigger_element'] );
		$opts['trigger_hide']                        = sanitize_text_field( $opts['trigger_hide'] );
		$opts['trigger_hide_percentage']             = absint( $opts['trigger_hide_percentage'] );
		$opts['trigger_hide_element']                = sanitize_text_field( $opts['trigger_hide_element'] );
		$opts['screen_size_condition']['value'] = intval( $opts['screen_size_condition']['value'] );

		return $opts;
	}

	/**
	 * Add the settings link to the Plugins overview
	 *
	 * @param array  $links
	 * @param string $slug
	 *
	 * @return array
	 */
	public function add_plugin_settings_link( $links, $slug ) {
		if ( $slug !== $this->plugin->slug() || ! is_array( $links ) ) {
			return $links;
		}

		$settings_link = '<a href="' . admin_url( 'edit.php?post_type=boxzilla-box' ) . '">' . __( 'Boxes', 'boxzilla' ) . '</a>';
		array_unshift( $links, $settings_link );

		return $links;
	}

	/**
	 * Adds meta links to the plugin in the WP Admin > Plugins screen
	 *
	 * @param array  $links
	 * @param string $slug
	 *
	 * @return array
	 */
	public function add_plugin_meta_links( $links, $slug ) {
		if ( $slug !== $this->plugin->slug() ) {
			return $links;
		}

		$links[] = '<a href="https://kb.boxzillaplugin.com/#utm_source=wp-plugin&utm_medium=boxzilla&utm_campaign=plugins-page">Documentation</a>';
		$links[] = '<a href="https://boxzillaplugin.com/add-ons/#utm_source=wp-plugin&utm_medium=boxzilla&utm_campaign=plugins-page">Add-ons</a>';

		return $links;
	}

	/**
	 * Flush all box rules
	 *
	 * Loops through all published boxes and fills the rules option
	 *
	 * @param int $post_id
	 */
	public function flush_rules( $post_id ) {

		// only act on our own post type
		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post || $post->post_type !== 'boxzilla-box' ) {
			return;
		}

		// get all published boxes
		$query = new \WP_Query;
		$boxes = $query->query(
			array(
				'post_type'           => 'boxzilla-box',
				'post_status'         => 'publish',
				'posts_per_page'      => - 1,
				'ignore_sticky_posts' => true,
				'no_found_rows'       => true,
			)
		);

		// setup empty array of rules
		$rules = array();

		// fill rules array
		if ( is_array( $boxes ) ) {
			foreach ( $boxes as $box ) {
				// get box meta data
				$box_meta = get_post_meta( $box->ID, 'boxzilla_options', true );

				// add box rules to all rules
				$rules[ $box->ID ]                = (array) $box_meta['rules'];
				$rules[ $box->ID ]['comparision'] = isset( $box_meta['rules_comparision'] ) ? $box_meta['rules_comparision'] : 'any';
			}
		}

		update_option( 'boxzilla_rules', $rules );
	}

	/**
	 * Fetches a list of available add-on plugins
	 *
	 * @return array
	 */
	protected function fetch_extensions() {
		$extensions = get_transient( 'boxzilla_remote_extensions' );
		if ( $extensions ) {
			return $extensions;
		}

		$response = wp_remote_get( 'https://my.boxzillaplugin.com/api/v2/plugins' );
		if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) >= 400 ) {
			return array();
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body );
		if ( is_array( $data ) ) {
			set_transient( 'boxzilla_remote_extensions', $data, 24 * HOUR_IN_SECONDS );
			return $data;
		}

		return array();
	}

	/**
	 * @param $arr
	 * @param $insert
	 * @param $position
	 *
	 * @return array
	 */
	public static function array_insert( $arr, $insert, $position ) {
		$i   = 0;
		$ret = array();
		foreach ( $arr as $key => $value ) {
			if ( $i == $position ) {
				foreach ( $insert as $ikey => $ivalue ) {
					$ret[ $ikey ] = $ivalue;
				}
			}
			$ret[ $key ] = $value;
			$i ++;
		}

		return $ret;
	}

	/**
	 * @param string $text
	 *
	 * @return string
	 */
	public function admin_footer_text( $text ) {
		$screen = get_current_screen();

		if ( ! $screen instanceof WP_Screen ) {
			return $text;
		}

		$on_edit_page = $screen->parent_base === 'edit' && $screen->post_type === 'boxzilla-box';
		if ( $on_edit_page ) {
			return sprintf( 'If you enjoy using <strong>Boxzilla</strong>, please <a href="%s" target="_blank">leave us a ★★★★★ rating</a>. A <strong style="text-decoration: underline;">huge</strong> thank you in advance!', 'https://wordpress.org/support/view/plugin-reviews/boxzilla?rate=5#postform' );
		}

		return $text;
	}


}
