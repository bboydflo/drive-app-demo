'use strict';

// define button model
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(o) {
      super(o);
    }

    defaults() {
      return {
        icon: '',
        title: '',
        error: false,
        visible: false,
        destroy: true,
        options: {
          backdrop: 'static',
          keyboard: true,
          show: false,
          xModal: true
        },
        buttons: []
      };
    }
  };
};
