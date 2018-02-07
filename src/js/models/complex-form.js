'use strict';

// define complex-form model
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(options) {
      super(options);
    }

    defaults() {
      return {
        errors: [],
        groups: []
      };
    }
  };
};
