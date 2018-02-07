'use strict';

// exports
export default (Layout, template) => {

  // return pdf view
  return class V extends Layout {

    constructor(options) {
      super(options);

      // remove wrapper div
      this.el = false;

      // define view template
      this.template = template;
    }
  };
};
