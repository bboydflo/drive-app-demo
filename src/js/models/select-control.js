'use strict';

// define select-control button model
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(options) {
      super(options);
    }

    defaults() {
      return {
        options: [],
        selected: -1
      };
    }
  };
};
