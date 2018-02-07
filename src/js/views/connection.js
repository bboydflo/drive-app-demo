'use strict';

// exports
export default (Layout, template) => {

  // return connection view
  return class V extends Layout {

    constructor(options) {
      super(options);

      // remove wrapper element
      this.el = false;

      // define view template
      this.template = template; // Templates.hbs.connection;
    }

    initialize() {

      // listen for model changes
      this.listenTo( this.model, 'change', this.render, this );
    }
  };
};
