'use strict';

// define gauges model
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(options) {
      super(options);
    }

    defaults() {
      return {
        layout: '',
        counter: 0,
        connection: true
      };
    }
  };
};
