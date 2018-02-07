'use strict';

// exports
export default (Backbone) => {

  // return layout model
  return class M extends Backbone.Model {

    constructor(o) {
      super(o);
    }

    defaults() {
      return {
        sessionKey: false,
        loginType: -1,
        left: {},
        center: {},
        right: {}
      };
    }
  };
};
