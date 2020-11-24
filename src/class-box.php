<?php

namespace Boxzilla;

use WP_Post;

class Box {


	/**
	 * @var int
	 */
	public $ID;

	/**
	 * @var array
	 */
	public $options = array();

	/**
	 * @var string
	 */
	public $title = '';

	/**
	 * @var string
	 */
	protected $content = '';

	/**
	 * @var bool
	 */
	public $enabled = false;

	/**
	 * @var WP_Post
	 */
	private $post;

	/**
	 * @param WP_Post|int $post
	 */
	public function __construct( $post ) {

		// fetch post if it hasn't been fetched yet
		if ( ! $post instanceof WP_Post ) {
			$post = get_post( $post );
		}

		// store ref to post
		$this->post = $post;

		// store ID in property for quick access
		$this->ID = $post->ID;

		// store title in property
		$this->title = $post->post_title;

		// store content in property
		$this->content = $post->post_content;

		// is this box enabled?
		$this->enabled = ( $post->post_status === 'publish' );

		// load and store options in property
		$this->options = $this->load_options();
	}

	/**
	 * Get the options for this box.
	 **
	 * @return array Array of box options
	 */
	protected function load_options() {
		$defaults = array(
			'css'                   => array(
				'background_color' => '',
				'color'            => '',
				'width'            => '',
				'border_color'     => '',
				'border_width'     => '',
				'border_style'     => '',
				'position'         => 'bottom-right',
			),
			'rules'                 => array(
				0 => array(
					'condition' => '',
					'value'     => '',
				),
			),
			'rules_comparision'     => 'any',
			'cookie'                => array(
				'triggered' => 0,
				'dismissed' => 0,
			),
			'trigger'               => 'percentage',
			'trigger_percentage'    => 65,
			'trigger_element'       => '',
			'trigger_time_on_site'  => 0,
			'trigger_time_on_page'  => 0,
			'animation'             => 'fade',
			'auto_hide'             => 0,
			'trigger_hide'          => '',
			'trigger_hide_percentage'    => 85,
			'trigger_hide_element'       => '',
			'screen_size_condition' => array(
				'condition' => 'larger',
				'value'     => 0,
			),
			'closable'              => 1,
			'show_close_icon'       => 1,
		);
		$box      = $this;

		$options = get_post_meta( $this->ID, 'boxzilla_options', true );
		$options = is_array( $options ) ? $options : array();

		// merge options with default options
		$options = array_replace_recursive( $defaults, $options );

		// allow others to filter the final array of options
		/**
		 * Filter the options for a given box
		 *
		 * @param array $options
		 * @param Box $box
		 */
		$options = apply_filters( 'boxzilla_box_options', $options, $box );

		return $options;
	}

	/**
	 * @return bool
	 */
	public function is_enabled() {
		return $this->enabled;
	}

	/**
	 * Get the options for this box
	 *
	 * @return array
	 */
	public function get_options() {
		return $this->options;
	}

	/**
	 * Get the close / hide icon for this box
	 *
	 * @return string
	 */
	public function get_close_icon() {
		if ( ! $this->options['show_close_icon'] ) {
			return '';
		}

		$box  = $this;
		$html = '&times;';

		/**
		 * Filters the HTML for the close icon.
		 *
		 * @param string $html
		 * @param Box $box
		 */
		$close_icon = (string) apply_filters( 'boxzilla_box_close_icon', $html, $box );

		return $close_icon;
	}

	/**
	 * Get the content of this box
	 *
	 * @return string
	 */
	public function get_content() {
		$content = $this->content;
		$box     = $this;

		// replace boxzilla specific shortcodes
		$close_link = sprintf( '<a href="javascript:Boxzilla.dismiss(%d);">', $this->ID );

		$replacements = array(
			'[boxzilla_close]'  => $close_link, // accept underscore and dash here for consistency with other shortcode
			'[boxzilla-close]'  => $close_link,
			'[/boxzilla_close]' => '</a>',
			'[/boxzilla-close]' => '</a>',
		);

		$content = str_replace( array_keys( $replacements ), array_values( $replacements ), $content );

		/**
		 * Filters the HTML for the box content
		 *
		 * @param string $content
		 * @param Box $box
		 */
		$content = apply_filters( 'boxzilla_box_content', $content, $box );
		return $content;
	}

	/**
	 * Get options object for JS script.
	 *
	 * @return array
	 */
	public function get_client_options() {
		$box = $this;

		$trigger = false;
		if ( $box->options['trigger'] ) {
			$trigger = array(
				'method' => $this->options['trigger'],
			);

			if ( isset( $this->options[ 'trigger_' . $this->options['trigger'] ] ) ) {
				$trigger['value'] = $this->options[ 'trigger_' . $this->options['trigger'] ];
			}
		}

		$trigger_hide = false;
		if ( $box->options['trigger_hide'] ) {
			$trigger_hide = array(
				'method' => $this->options['trigger_hide'],
			);

			if ( isset( $this->options[ 'trigger_hide_' . $this->options['trigger_hide'] ] ) ) {
				$trigger_hide['value'] = $this->options[ 'trigger_hide_' . $this->options['trigger_hide'] ];
			}
		}


		// build screenWidthCondition object (or null)
		$screen_width_condition = null;
		if ( $box->options['screen_size_condition']['value'] > 0 ) {
			$screen_width_condition = array(
				'condition' => $box->options['screen_size_condition']['condition'],
				'value'     => intval( $box->options['screen_size_condition']['value'] ),
			);
		}

		$client_options = array(
			'id'                   => $box->ID,
			'icon'                 => $box->get_close_icon(),
			'content'              => '', // we grab this later from an HTML element
			'css'                  => array_filter( $box->options['css'] ),
			'trigger'              => $trigger,
			'animation'            => $box->options['animation'],
			'cookie'               => array(
				'triggered' => absint( $box->options['cookie']['triggered'] ),
				'dismissed' => absint( $box->options['cookie']['dismissed'] ),
			),
			'rehide'               => (bool) $box->options['auto_hide'],
			'triggerHide'         => $trigger_hide,
			'position'             => $box->options['css']['position'],
			'screenWidthCondition' => $screen_width_condition,
			'closable'             => ! ! $box->options['closable'],
			'post'                 => array(
				'id'    => $this->post->ID,
				'title' => $this->post->post_title,
				'slug'  => $this->post->post_name,
			),
		);

		/**
		 * Filter the final options for the JS Boxzilla client.
		 *
		 * @param array $client_options
		 * @param Box $box
		 */
		$client_options = apply_filters( 'boxzilla_box_client_options', $client_options, $box );

		return $client_options;
	}
}
