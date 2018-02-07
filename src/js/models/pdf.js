'use strict';

// define button model
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(options) {
      super(options);
    }

    defaults() {
      return {
        fileName: '',
        viewHeight: 100,
        resourceLink: ''
      };
    }
  };
};
