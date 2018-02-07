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

        // 0 -> glyphicons
        // 1 -> font awesome
        // 2 -> florin font
        type: 1,
        connection: true
      };
    }
  };
};
