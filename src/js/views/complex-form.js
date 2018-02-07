'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, trim, assign, filter, concat, isArray, isNumber, cloneDeep, capitalize } from 'lodash';

// exports
export default ( $, DateFormat, Layout, Language, template, utils, session ) => {

  // return complex form view
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // remove div wrapper
        el: false,

        // define template
        template: template,

        // define events
        events: {
          'hide .datepicker': 'updateDate',
          'keydown .sp-value': 'skipEnter',
          'keyup .sp-value': 'checkInput',
          'change .sp-value': 'changeInput',
          // 'keyup .form-control': 'checkInput',
          // 'change .form-control': 'changeInput',
          'keyup .filter-value': 'checkInput',
          'change .filter-value': 'changeInput',
          'click .clear-single-filter': 'clearField'
        }
      }, o));
    }

    serialize() {
      var firstDate,
        hbsObj = {
          groups: []
        },
        groups = this.model.get( 'groups' );

      // if this complex form is not a filter formular
      if ( !this.filter ) {

        // current group
        var medarbejderGroup = -1;

        // update groups
        groups = map(groups, function(group){

          // get fields
          group.fields = map(group.fields, function(field){
            var dateFormat, options, _default, selectOpt,
              selectBox = '',
              htmlInput = '';

            // create form imputs depending on field type
            switch ( field.type ) {
            // show labels only. cannot change values
            case 0:
              // update html input
              htmlInput = '<p class="form-control-static sp-value" data-col="' + field.col +
                '" data-type="' + field.type +
                '">' + field.val + '</p>';
              break;
            // number and 1000 days format
            case 1:
            case 11:
              // update html input
              htmlInput = '<input type="number" class="form-control sp-value" name="' + field.label.value +
                  '" data-col="' + field.col +
                  '" data-findex="' + field.findex +
                  '" data-type="'+ field.type +
                  '" placeholder="' + field.label.value +
                  '" value="' + field.val + '">';
              break;
            case 3:
              // update html input
              htmlInput = '<p class="form-control-static datepicker sp-value" data-col="' + field.col +
                '" data-type="' + field.type +
                '">';

              // check set date flag
              if ( !firstDate && !field.val ) {

                // get date format
                dateFormat = session.get( 'settings', 'dateFormat' );

                // update first date flag
                firstDate = true;

                // update field
                // field.val = Moment().format( dateFormat ).toString();
                field.val = DateFormat.asString( dateFormat, new Date() );

                // update dirty
                field.dirty = true;
              }

              // check value
              if ( field.val ) {

                // update html input
                htmlInput += field.val;
              }

              // update html input
              htmlInput += '</p>';
              break;
            case -1:
            case 4:

              // checked support
              var checkedState = field.val ? 'checked' : '';

              // update html input
              htmlInput =
                '<div data-type="' + field.type + '">' +
                  '<input type="checkbox" class="modal-form-checkmark sp-value" name="' + field.label.value +
                  '" data-type="' + field.type +
                  '" data-col="' + field.col +
                  '" data-findex="' + field.findex +
                  '" ' + checkedState +
                  '>' +
                '</div>';
              break;
            case 5:
            case 6:
            case 7:
            case 10:

              try{
                options = JSON.parse( field.options );
              } catch( e ){

                // reset select opt
                options = '';

                // resume
                return;
              }

              // check field type
              if ( field.type == 10 && medarbejderGroup !== field.group ) {

                // update medarbejder group
                medarbejderGroup = field.group;

                // update field with medarbejder code
                _default = true;
              } else {

                // do not update field with medarbejder code
                _default = false;
              }

              // get select
              selectOpt = utils.createSelectInput(options, _default, session.get('cache', 'credentials', 'user') );

              // if should select default option
              if ( _default ) {

                // update field
                field.val = selectOpt[0].key;

                // update dirty
                field.dirty = true;

                // update select options
                selectOpt.unshift({
                  key: selectOpt[0].key,
                  value: selectOpt[0].value
                });
              } else {

                // update select options
                selectOpt.unshift({
                  key: 'select',
                  value: 'Select'
                });
              }

              // create options
              map(selectOpt, function(opt){

                // build select box
                selectBox += '<option value=' + opt.key + '>' + opt.value + '</option>';
              });

              // update html input
              htmlInput = '<select class="form-control sp-value" data-col="' + field.col +
                  '" data-findex="' + field.findex +
                  '" data-type="' + field.type +
                  '">' + selectBox + '</select>';
              break;
            default:

              // case  1, 2, 8, 9, 11
              // update html input
              htmlInput = '<input type="text" class="form-control sp-value" name="' + field.label.value +
                  '" data-col="' + field.col +
                  '" data-findex="' + field.findex +
                  '" data-type="'+ field.type +
                  '" placeholder="' + field.label.value +
                  '" value="' + field.val + '">';
              break;
            }

            // update field value
            field.value = htmlInput;

            // resume
            return field;
          });

          // resume
          return group;
        });

        // update grouops
        this.model.set( 'groups', groups );
      }

      // update handlebars object
      hbsObj.groups = groups;

      // resume
      return hbsObj;
    }

    afterRender() {

      // date format
      var dateFormat = session.get( 'settings', 'dateFormat' ).toLowerCase();

      // get all datepicker elements
      var $datePickers = this.$el.find( '.datepicker' );

      // check if any datepicker found
      if ( $datePickers.length ) {

        // apply datepicker plugin
        $datePickers.datepicker({
          language: this.lang || 'dk',
          format: dateFormat,
          todayBtn: 'linked',
          autoclose: true,
          todayHighlight: true
        });
      }
    }

    updateDate( event ) {
      event.stopPropagation();

      // local vars
      var value,
        groups      = this.model.get( 'groups' ),
        $el         = $( event.target ),
        cIndex      = $el.data( 'col' ),
        currentVal  = $el.text();

      // get datepicker value
      if ( event.format() ) {
        value = event.format();
      } else {
        value = $el.text();
      }

      // validate date
      if ( value ) {

        // unchaged date
        if ( value == currentVal ) return false;

        // update innerHTML
        $el.text( value );
      }

      // map through each group
      groups = map(groups, function(group){

        // map through
        group.fields = map(group.fields, function(field){

          // filter criteria
          if ( field.col == cIndex ) {

            // update field value
            field.val = value;

            // update dirty
            field.dirty = true;
          }

          // resume
          return field;
        });

        // resume
        return group;
      });

      // update elements
      this.model.set( 'groups', groups );
    }

    serializeForm() {

      // check if form has errors
      if ( this.hasErrors() ) return false;

      // define form data
      var formData = [];

      // get groups
      var groups = this.model.get( 'groups' );

      // map through each group
      map(groups, function(group){

        // get form data
        var fields = filter(group.fields, function(el){

          // filter criteria
          return el.type;
        });

        //  concat current array with fields
        formData = concat(formData, fields);
      });

      // resume
      return formData;
    }

    hasErrors() {
      var fail = false,
        error = {
          col: -1,
          visible: false,
          title: '',
          message: ''
        },
        errors = this.getErrorBy();

      // labels
      var t1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[this.lang];
      var t2 = session.get( 'sp_lang', 'SP_IndexErrorMsg7') || Language.index.errorMsg7[this.lang];

      // validate errors
      if ( errors && errors.length ) {

        // define single error for multiple errors
        error  = {
          col: 9999,
          visible: true,
          title: 'SmartPigs ' + capitalize( t1 ) + ': ',
          message: errors.length + ' ' + t2
        };

        // trigger error
        this.trigger( 'error', error );

        // resume
        fail = true;
      }

      // resume
      return fail;
    }

    getFilter() {
      var filterOb = [];
      var formData = this.serializeForm();

      // check if form has errors
      if ( !formData || !isArray(formData) ) return false;

      // map through form data to get the filter object
      map(formData, function(formField){
        var isDirty = ( typeof formField.val == 'string' && formField.val ) || isNumber( formField.val );
        if( isDirty ) {
          filterOb.push({
            col: formField.col,
            val: formField.val.toString().toLowerCase()
          });
        }
      });

      // resume
      return filterOb;
    }

    // helper method
    getRowId() {

      // get form data
      var elements = this.model.get( 'elements' );

      // validate elements
      if ( !elements.length ) return false;

      // return id
      return getProp( elements[0], ['rowId'], false );
    }

    skipEnter( event ) {

      // get keycode
      var keycode = ( event.keyCode ? event.keyCode : event.which );

      // on enter
      if ( keycode == 13 ) {

        // prevent default event (submit form)
        event.preventDefault();
        event.stopPropagation();

        // get value
        var value = this.checkInput( event );

        // update value anyway
        if ( typeof value !== 'undefined' ) {

          // get input and column index
          var $input = $( event.target );
          var cIndex = parseInt( $input.data( 'col' ), 10 );

          // update that field anyway
          this.updateValue( cIndex, value );
        }

        // check if has focused next input field
        if ( this.focusNext( event ) ) return;
      }
    }

    focusNext( event ) {
      var keycode = ( event.keyCode ? event.keyCode : event.which );

      // on enter
      if ( keycode == 13 ) {

        // prevent default event (submit form)
        event.preventDefault();
        event.stopPropagation();

        // get current field index
        var currentField = $( event.currentTarget ).data( 'findex' );

        // find next field
        // nextField = $( 'input[data-findex='+ (parseInt(currentField) + 1) + ']' );
        var nextField = $( '[data-findex='+ (parseInt(currentField, 10) + 1) + ']' );

        // check if next field exists
        if ( nextField.length ) {

          // focus on next field
          nextField.focus();

          // return true;
          return true;
        }
      }
    }

    checkInput( event ) {
      var $input = $( event.target ),
        cIndex = parseInt( $input.data( 'col' ), 10 ),
        iClick = parseInt( $input.data( 'type' ), 10 );

      // check if input should be a number
      if ( iClick == 1 || iClick == 7 || iClick == 11) { // iClick == -1 ||
        return this.checkNumberInput( $input, cIndex );
      }

      // resume
      return;
    }

    changeInput( event ) {
      var value,
        $input = $( event.target ),
        cIndex = parseInt( $input.data( 'col' ), 10 ),
        iClick = parseInt( $input.data( 'type' ), 10 );

      // check column
      if( iClick < 0 || iClick == 4 ) {

        // check input type
        if( $input.attr('type') == 'checkbox' ) {

          // get value
          value = $input.prop( 'checked' ) ? 1 : 0;
        }
      }

      // undefined?
      if( typeof value == 'undefined' ) {

        // get value
        value  = trim( $input.val() );

        // check if any value
        if ( !value || value == 'select' ) return false;
      }

      // labels
      var t1 = session.get( 'sp_lang', 'SP_Toast1') || Language.toast[1][this.lang];

      // validate input type
      if ( iClick == -1 || iClick == 1 || iClick == 4 || iClick == 5 || iClick == 7 || iClick == 11) {

        // update value
        value = utils.toNumber( value );

        // validate number
        if ( isNaN(value) ) {

          // toast and resume
          return $.publish( 'toast', [2, $input.val() + t1] );
        }
      }

      // update value
      if ( this.updateValue(cIndex, value) ) {

        // rerender view
        this.render();
      }
    }

    clearField( event ) {
      var inputId = $( event.currentTarget ).data( 'id' );
      var cIndex  = $( event.currentTarget ).data( 'col' );

      // update value
      this.clearValue( cIndex );

      // select input with inputId and clear its value
      this.$( '#' + inputId ).val( '' );
    }

    clearAllFields() {

      // keep refference to this view
      var _self = this;

      // clear each value
      this.$( '.form-control' ).map(function(){
        var $field = $( this );
        var val = $field.val();
        var col = $field.data( 'col' );

        // check value
        if ( !val ) return;

        // clear value
        _self.clearValue( col );

        // clear field as well
        $field.val( '' );
      });
    }

    updateValue( cIndex, value ) {
      var shouldRefresh,
        isFilterForm = this.filter ? true : false;

      // get date format
      var dateFormat = session.get( 'settings', 'dateFormat' );

      // map through each group
      var groups = map(this.model.get('groups'), function(group){

        // should update date flag
        var shouldUpdateDate = false;

        // map through
        group.fields = map(group.fields, function(field){

          // filter criteria
          if ( field.col == cIndex ) {

            // update field value
            field.val = value;

            // make field dirty
            field.dirty = true;

            // update should update date flag
            shouldUpdateDate = true;
          }

          // resume
          return field;
        });

        // should update date
        if ( shouldUpdateDate && !isFilterForm ) {

          // map through
          group.fields = map(group.fields, function(field){

            // filter criteria
            if ( field.type == 3 && !field.val ) {

              // update field value
              field.val = DateFormat.asString( dateFormat, new Date() );

              // make field dirty
              field.dirty = true;

              // should refresh form view
              shouldRefresh = true;
            }

            // resume
            return field;
          });
        }

        // resume
        return group;
      });

      // update elements model
      this.model.set( 'groups', groups );

      // resume
      return shouldRefresh;
    }

    clearValue( cIndex ) {

      // map through each group
      var groups = map(this.model.get('groups'), function(group){

        // map through
        group.fields = map(group.fields, function(field){

          // filter criteria
          if ( field.col == cIndex ) {

            // update field value
            field.val = '';

            // make field dirty
            field.dirty = true;
          }

          // resume
          return field;
        });

        // resume
        return group;
      });

      // update elements model
      this.model.set( 'groups', groups );
    }

    checkNumberInput( $input, col ) {
      var value = trim( $input.val() );

      // no value
      if ( !value ) {

        // empty field should be valid
        $input.closest( 'div.form-group' ).removeClass( 'has-error' );

        // remove error
        this.removeErrorBy( 'col', col );

        // resume
        return;
      }

      // get element value and convert it to a number
      var number = utils.toNumber( value );

      // it's not a number
      if ( isNaN(number) ) {

        // not a valid number
        $input.closest( 'div.form-group' ).removeClass( 'has-success' ).addClass( 'has-error' );

        // labels
        var t1 = session.get( 'sp_lang', 'SP_Toast1') || Language.toast[1][this.lang];
        var t2 = session.get( 'sp_lang', 'SP_IndexErrorMsg7') || Language.index.errorMsg7[this.lang];

        // set error
        this.setError({
          col: col,
          visible: true,
          title: 'SmartPigs ' + capitalize( t2 ) + ': ',
          message: value + ' ' + t1
        });

        // resume
        return;
      }

      // remove current error
      this.removeErrorBy( 'col', col );

      // valid number
      $input.closest( 'div.form-group' ).removeClass( 'has-error' ).addClass( 'has-success' );

      // resume
      return number;
    }

    focusInput() {

      // get first input element and set focus on it
      this.$el.find( 'input:first' ).focus();
    }

    // helper method to retrieve single/multiple errors
    getErrorBy( attr, value ) {
      var args   = Array.prototype.slice.call( arguments ),
        errors = cloneDeep( this.model.get('errors') );

      // validate arguments
      if ( args.length < 2 ) return errors;

      // filter through errors
      errors = filter(errors, function( err ){

        // filter criteria
        return err[ attr ] == value;
      });

      // check length. return first error
      if ( errors.length ) return errors[ 0 ];

      // resume
      return false;
    }

    // helper method to remove error by attribute and value
    removeErrorBy( attr, value ) {
      var errors = this.getErrorBy();

      // if element has been found
      if ( this.getErrorBy(attr, value) ) {

        // filter through errors
        errors = filter(errors, function(err){

          // filter criteria
          return err[ attr ] !== value;
        });

        // update new filtered errors
        this.model.set( 'errors', errors );
      }
    }

    // helper method to set an error or replace the old
    setError( err ) {

      // remove previous error
      this.removeErrorBy( 'col', err.col || -1 );

      // get errors
      var errors = this.getErrorBy();

      // insert error at specific position
      errors.splice( err.col, 0, err );

      // update errors
      this.model.set( 'errors', errors );
    }

    updateField( value ) {

      // get first input element and set focus on it
      this.$el.find( 'input:focus' ).val( value ).trigger( 'change' );
    }
  };
};
