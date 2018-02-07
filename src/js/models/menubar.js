'use strict';

// define menubar model factory
export default (Backbone) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(o) {
      super(o);
    }

    defaults() {
      return {
        type: 0,
        value: '',
        user: '',
        connection: 1,
        hidden: false,
        listen: true,
        items: [],
        allowOffline: false
      };
    }
  };
};
