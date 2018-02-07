'use strict';

// define progeny model
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(options) {
      super(options);
    }

    defaults() {
      return {
        layout: {},
        data: {},
        dataType: 'json',
        connection: 1,
        dirty: false,
        prev: '',
        error: '',
        hasCheckmark: false,
        counter: {
          visible: false,
          title: 'Total',
          total: 0,
          hidden: 0,
          selected: 0
        },
        previousRoute: '',
        findAnimal: false,
        sortType: 0,
        sortIndex: -1
      };
    }
  };
};
