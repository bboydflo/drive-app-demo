'use strict';

// define details-form model factory
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(o) {
      super(o);
    }

    defaults() {
      return {
        title: '',
        fields: [],
        update: '',
        delete: ''
      };
    }
  };
};
