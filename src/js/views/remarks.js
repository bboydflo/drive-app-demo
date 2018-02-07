'use strict';

// lodash utils
import { assign, capitalize } from 'lodash';

// exports
export default (Layout, Language, template, session) => {

  // return remarks view
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // remove wrapper div
        el: false,

        // define view template
        template: template,

        // default remark
        remark: '',

        // define view events
        events: {
          'click button': 'editRemark'
        }
      }, o));
    }

    // Renders the view's template to the UI
    serialize() {

      // labels
      var t0 = session.get( 'sp_lang', 'SP_LabelsInsertRemark') || Language.labels.insertRemark[this.lang];
      var t1 = session.get( 'sp_lang', 'SP_ButtonUpdate') || Language.button.update[this.lang];

      return {
        placeholder: t0,
        remark: this.remark,
        save: capitalize( t1 ),
      };
    }

    updateRemark( remark ) {
      this.remark = remark;
    }

    editRemark( e ) {

      // prevent default event
      e.preventDefault();

      // get new remark
      var newRemark = this.$( '.form-control' ).val();

      // trigger edit-remark event
      this.trigger( 'edit-remark', newRemark );
    }
  };
};
