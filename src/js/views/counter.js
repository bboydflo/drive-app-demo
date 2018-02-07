'use strict';

// lodash functions
import { assign, includes } from 'lodash';

// exports
export default (Layout, template) => {

  // return counter view
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // remove wrapper div
        el: false,

        // define view template
        template: template
      }, o));
    }

    initialize() {

      // listen for model changes
      this.listenTo( this.model, 'change', this.render, this );
    }

    serialize() {

      // get current counter data
      var cData = this.model.toJSON();

      return {
        title: cData.title,
        selected: cData.selected,
        visible: cData.total - cData.hidden
      };
    }

    // is valid attribute
    isValidAttr(attr) {
      return includes( ['total', 'hidden', 'selected'], attr );
    }

    // new api
    // examples: inc('hidden'); || inc('total') || inc('selected');
    inc(attr) {

      // get current value
      var currentVal;

      // valid attribute
      if ( this.isValidAttr(attr) ) {

        // get current value
        currentVal = this.model.get( attr );

        // update model
        this.model.set( attr, currentVal + 1 );
      }
    }

    // new api
    // examples: decr('hidden'); || decr('total') || decr('selected');
    decr(attr) {

      // get current value
      var currentVal;

      // valid attribute
      if ( this.isValidAttr(attr) ) {

        // get current value
        currentVal = this.model.get( attr );

        // update model
        this.model.set( attr, currentVal - 1 );
      }
    }

    // new api
    // examples: update('hidden', 10); || update('total', 10) || update('selected', 10);
    update(key, value) {

      // value is defined and not null
      if ( value === null || typeof value == 'undefined' || !this.isValidAttr(key) ) {
        return;
      }

      // update model
      this.model.set( key, value );
    }
  };
};
