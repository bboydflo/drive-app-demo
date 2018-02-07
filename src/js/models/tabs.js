'use strict';

// exports
export default (Backbone) => {

  // return tabs model
  return class M extends Backbone.Model {

    constructor(o) {
      super(o);
    }

    defaults() {
      return {
        /*tabs: [{
          id: 'entry',
          icon: 'icon_animalMenuItem',
          index: 0,
          active: false,
          addRow: false
        }]*/
        tabs: []
      };
    }
  };
};
