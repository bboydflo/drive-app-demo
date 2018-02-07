'use strict';

// define button model factory
export default (Backbone) => {

  // returns backbone model
  return class M extends Backbone.Model {
    constructor(o) {
      super(o);
    }

    defaults() {
      return {
        visible: false,
        class: '',
        title: '',
        icon: '',
        event: '',
        href: '',
      };
    }
  };
};
