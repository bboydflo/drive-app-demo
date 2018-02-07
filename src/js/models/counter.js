'use strict';

// define counter model
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(options) {
      super(options);
    }

    defaults(){
      return {
        title: '',
        total: 0,
        hidden: 0,
        selected: 0
      };
    }
  };
};
