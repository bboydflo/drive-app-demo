'use strict';

// lodash functions
import { map, trim, filter } from 'lodash';

// exports
export default ( $, Layout, template, Language, AlertModal, utils, session ) => {

  // return details view
  return class V extends Layout {

    constructor(o) {
      super(o);

      // no wrapping element
      this.el = false;

      // define template function
      this.template = template;

      // events
      this.events = {
        'click .btn-update': 'onUpdate',
        'click .btn-delete': 'onDelete',
        'change .sp-value': 'changeInput'
      };
    }

    initialize() {

      // render
      this.render();
    }

    onUpdate( ev ) {

      // local vars
      var fields = this.model.get( 'fields' ),
        updatedFields = [];

      // prevent default event
      ev.preventDefault();
      ev.stopPropagation();

      // filter through current form fields
      updatedFields = filter(fields, function(f){

        // filter criteria
        return f.dirty;
      });

      // check if any field has been updated
      if ( !updatedFields.length ) {

        // resume and toast
        return $.publish( 'toast', [2, 'no updated fields!'] );
      }

      // trigger update event
      this.trigger( 'update', updatedFields );
    }

    onDelete( ev ) {
      var alertModal,
        _self  = this,
        fields = this.model.get( 'fields' );

      // prevent default event
      ev.preventDefault();
      ev.stopPropagation();

      // labels
      var t1 = session.get( 'sp_lang', 'SP_LabelsDeleteEvent') || Language.labels.deleteEvent[this.lang];
      var b1 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[this.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[this.lang];

      // create alert modal
      alertModal = AlertModal({
        title: t1,
        message: 'Are you sure you want to delete this event?',
        cancel: b1,
        confirm: b2,
        confirmVisible: true,
        cancelVisible: true
      });

      // listen for custom events
      // alertModal.on( 'visible', topView.togglePopup,  topView );
      // alertModal.on( 'hidden', topView.togglePopup, topView );
      alertModal.on('confirm', function(){

        // hide dialog
        this.hide(function(){

          // trigger update event
          _self.trigger( 'delete', fields );
        });
      });

      // render alert
      alertModal.render();

      // // trigger update event
      // this.trigger( 'delete', fields );
    }

    changeInput( event ) {

      // local vars
      var value,
        lang = this.lang,
        fields = this.model.get( 'fields' ),
        $input = $( event.target ),
        cIndex = parseInt( $input.data( 'col' ), 10 ),
        iClick = parseInt( $input.data( 'type' ), 10 );

      // check if not checkmark
      if ( iClick == 4 ) {

        // get value
        value = $input.prop( 'checked' ) ? 1 : 0;
      } else {

        // get value
        value = trim( $input.val() );

        // check if any value
        if ( !value ) {

          // resume
          return false;
        }
      }

      // validate input type
      if ( iClick == 1 || iClick == 4 || iClick == 5 || iClick == 7 || iClick == 11) {

        // update value
        value = utils.toNumber( value );

        // labels
        var t2 = session.get( 'sp_lang', 'SP_Toast1') || Language.toast[1][lang];

        // validate number
        if ( isNaN(value) ) {

          // toast and resume
          return $.publish( 'toast', [2, $input.val() + t2] );
        }
      }

      // map through
      map(fields, function(field){

        // filter criteria
        if (field.col !== cIndex || field.newVal == value) {

          // resume
          return field;
        }

        // make field dirty
        field.dirty = true;

        // update field value
        field.newVal = value;
      });

      // update elements model
      this.model.set( 'elements', fields );
    }
  };
};
