'use strict';

// libs
import getProp from 'get-prop';

// lodash helpers
import { assign, isFunction } from 'lodash';

// exports
export default ($, Backbone, template, ErrorModel, Toolbar, ErrorView, Buttons,
  Layout
) => {

  // return dialog view
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // no wrapping elements
        el: false,

        // dialog template
        template: template,

        // events
        events: {
          'show.bs.modal': 'onShow',
          'shown.bs.modal': 'onShown',
          'hide.bs.modal': 'onHide',
          'hidden.bs.modal': 'onHidden',
          'click .modal-footer .btn': 'triggerAction',
          'contextmenu': 'rightclick'
        },

        // custom events
        evs: {},

        // checkmark true means that the dialog toolbar needs to have a checkmark
        checkmark: false
      }, o));
    }

    initialize( obj, opt ) {

      // listen for model change
      this.listenTo( this.model, 'change:title', this.updateTitle );

      // listen for model change
      this.listenTo( this.model, 'change:error', this.updateError );

      // listen for model change
      this.listenTo( this.model, 'change:buttons', this.updateButtons );

      // on after render
      this.on( 'afterRender', this.toggle );

      // on cancel
      this.on( 'cancel', this.toggle );

      // checkmark support
      if ( getProp(opt, ['checkmark'], false) ){

        // update checkmark state
        this.checkmark = true;
        this.checkState = opt.checkState;
      }
    }

    serialize() {

      // resume
      return this.model.toJSON();
    }

    beforeRender() {

      // update buttons
      this.updateButtons();
    }

    afterRender() {

      // apply modal plugin
      this.$el.modal( this.model.get('options') );
    }

    isVisible() {

      // return visibility
      return this.model.get( 'visible' );
    }

    updateTitle() {

      // update dom
      this.$( '.modal-title .title' ).html( this.model.get('title') );
    }

    updateError(){

      // create error model
      var errorModel = new ErrorModel( this.model.get('error') );

      // create error view
      var errorView = new ErrorView({ model: errorModel });

      // update error in the current view
      this.setView( '.error-component', errorView );

      // render error view
      errorView.render();
    }

    hideError() {

      // get old error
      var error = this.model.get( 'error' );

      // update display property
      error.visible = false;

      // update error
      this.model.set( 'error', error );
    }

    updateButtons() {
      var toolbarCollection,
        buttons = this.model.get( 'buttons' ),
        buttonsView = this.getView( '.modal-footer' );

      // if dialog has buttons
      if ( buttons.length ) {

        // init buttons collection
        toolbarCollection = new Buttons( buttons );

        // create new buttons view
        buttonsView = new Toolbar({ collection: toolbarCollection });

        // checkmark support
        if ( this.checkmark ) {

          // pass checkmark option and state further
          buttonsView.checkmark = this.checkmark;
          buttonsView.checkState = this.checkState;
        }

        // append buttons view
        this.setView( '.modal-footer', buttonsView );

        // render buttons view
        buttonsView.render();
      }
    }

    onShow() {

      // progress = true
      $.publish( 'progress', [true] );
    }

    onShown() {

      // progress = false
      $.publish( 'progress', [false] );

      // toggle visibility
      this.toggleVisibility();

      // trigger ready
      this.trigger( 'visible' );

      // check custom callbacks
      if ( this.evs.onShown ) {

        // call back
        this.evs.onShown();
      }
    }

    onHide() {

      // progress = true
      $.publish( 'progress', [true] );
    }

    onHidden() {

      // progress = false
      $.publish( 'progress', [false] );

      // toggle visibility
      this.toggleVisibility();

      // trigger ready
      this.trigger( 'hidden' );

      // check custom callbacks
      if ( this.evs && this.evs.onHidden ) {

        // call back
        this.evs.onHidden();
      }

      // check if should autor-emove
      if ( this.model.get('destroy') ) {

        // remove
        this.remove();
      }
    }

    triggerAction(event) {

      // prevent default event
      event.preventDefault();

      // trigger event
      this.trigger( this.$( event.currentTarget ).data( 'event' ) || 'cancel' );
    }

    rightclick(event) {

      // stop propagation
      event.stopPropagation();
    }

    toggleVisibility() {

      // toggle state and update model
      this.model.set( 'visible', !this.isVisible() );
    }

    show(callback) {

      // if valid callback
      if ( isFunction(callback) ) {

        // update events with callback
        this.evs.onShown = callback.bind(this);
      }

      // toggle modal
      this.$el.modal( 'show' );

      // resume
      return this;
    }

    hide(callback) {

      // if valid callback
      if ( isFunction(callback) ) {

        // update events with callback
        this.evs.onHidden = callback.bind( this );
      }

      // toggle modal
      this.$el.modal( 'hide' );

      // resume
      return this;
    }

    toggle() {

      // toggle modal
      this.$el.modal( 'toggle' );

      // resume
      return this;
    }

    cleanup() {

      // local vars
      var ev;

      // loop through custom events
      for( ev in this.evs ) {

        // clear any callbacks
        this.evs[ ev ] = null;

        // delete key
        delete this.evs[ ev ];
      }

      // clear whole custom event object
      this.evs = null;
    }
  };
};
