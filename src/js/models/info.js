'use strict';

// exports
export default ( Backbone ) => {

  // export model
  return class M extends Backbone.Model{
    constructor(o) {
      super(o);
    }
    defaults() {
      return { headers: [] };
    }
  };
};
