'use strict';

// define login-form model
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(options) {
      super(options);
    }

    defaults() {
      return {
        database: '',
        databasePW: '',
        user: '',
        userPW: '',
        updateValue: 0,
        placeholderDb: 'database',
        placeholderPass: 'password',
        placeholderUser: 'user',
        lang: 'da'
      };
    }
  };
};
