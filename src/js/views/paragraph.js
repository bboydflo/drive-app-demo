'use strict';

// exports
export default ($, Clipboard, Layout, template) => {

  return class V extends Layout {
    constructor(o) {
      super(o);

      this.el = false;
      this.template = template;
      this.clipboard = null;
    }

    serialize() {
      return {
        isSupported: Clipboard.isSupported(),
        message: this.message, // options.message,
        clipboard: 'Copy to clipboard'
      };
    }

    afterRender() {

      // check support for clipboard
      if ( !Clipboard.isSupported() ) return;

      // init clipboard
      this.clipboard = new Clipboard( '.btn-clipboard' );

      // on success
      this.clipboard.on('success', function() {

        // show popover
        // $('.btn-clipboard').popover( 'show' );

        // toast
        $.publish( 'toast', [1, 'Copied to clipboard!'] );
      });

      // on error
      this.clipboard.on('error', function(e) {

        // toast
        $.publish( 'toast', [3, 'Clipboard error: ' + e.action] );
      });
    }

    cleanup() {
      if ( this.clipboard && Clipboard.isSupported() ) {
        this.clipboard.destroy();
      }
    }
  };
};
