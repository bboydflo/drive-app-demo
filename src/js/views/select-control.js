'use strict';

// exports
export default (Layout, template) => {

  // return select control view
  return class V extends Layout {

    constructor(options) {
      super(options);

      // remove wrapper div
      this.el = false;

      // define view template
      this.template = template;

      // define view events
      this.events = {
        'change': 'onChange'
      };
    }

    onChange() {

      // get
      var value = this.$el.val();

      // update selected value
      this.model.set( 'selected', value );
    }

    getValue() {

      // return selected value
      return this.model.get( 'selected' );
    }
  };
};
