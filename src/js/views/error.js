'use strict';

// require method
import { find } from 'lodash';

// define error view
export default ( Layout ) => {

  // define error view
  return class V extends Layout {
    constructor(options) {
      super(options);

      // events
      this.events = {
        'click .close': 'hideError'
      };
    }

    initialize() {

      // this.listenTo( this.model, 'change:visible', this.render );
      this.listenTo( this.model, 'change', this.render );
    }

    serialize() {
      return {
        display: this.model.get('visible') ? 'block' : 'none',
        title: this.model.get('title'),
        message: this.model.get('message')
      };
    }

    hideError() {

      // hide view
      this.model.set( 'visible', false );
    }

    updateAttr( attr, value ) {

      // get args
      var args  = Array.prototype.slice.call( arguments ),
        attrs = [ 'title', 'message', 'visible'];

      // validate arguments
      if ( args.length < 2 ) {

        // throw error
        throw { message: 'Not enough arguments' };
      }

      if ( args.length < 2 ) {

        // throw error
        throw { message: 'Not enough arguments' };
      }

      if( !find(attrs, function(key) { return key == attr; }) ) {

        // throw error
        throw { message: 'Not a valid key!' };
      }

      // update model
      this.model.set( attr, value );

      // resume
      return this;
    }
  };
};
