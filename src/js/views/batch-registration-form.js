'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, trim, filter, isArray, isEmpty, mapValues, cloneDeep, capitalize } from 'lodash';

// exports
export default (
  $,
  Layout,
  DateFormat,
  utils,
  session,
  Language,
  template
) => {

  // helper function to get options based on the current value
  const getOptions = (options, select) => {
    var finalOptions = {};

    // check select value
    // if ( select == '0' ) return finalOptions;
    if ( select === 0 ) return finalOptions;

    try {
      options = JSON.parse(options);

      // loop through key in the options
      for (var key in options) {

        // skip loop if the property is from prototype
        if (!options.hasOwnProperty(key)) continue;

        // get current value
        var val = options[key];

        // get positions if any
        if ( val.indexOf('|') < 0 ) continue;

        // get possible options
        var possibleOptions = val.split('|')[1];

        // get actual options as an array
        if ( !possibleOptions ) continue;

        // get possible values
        var possibleValues = possibleOptions.split(',');

        // validate possible values
        if ( !isArray(possibleValues) || possibleValues.length !== 3 ) continue;

        // get final options
        switch(select) {
        case 3:
          if ( possibleValues[0] == '1' ) {
            finalOptions[key] = val;
          }
          break;
        case 4:
          if ( possibleValues[1] == '1' ) {
            finalOptions[key] = val;
          }
          break;
        default:
          if ( possibleValues[2] == '1' ) {
            finalOptions[key] = val;
          }
          break;
        }
      }

      // resume
      return finalOptions;
    } catch(e) {
      return false;
    }
  };

  // return simple form view
  return class V extends Layout {

    constructor(options) {
      super(options);

      // static property. keeps state about toggle hidden fields state
      this.toggleHiddenFields = false;

      // remove wrapper div
      this.el = false;

      // define templatr
      this.template = template;

      // define events
      this.events = {
        'hide .datepicker': 'updateDate',
        'keydown .sp-value': 'skipEnter',
        'keyup .sp-value': 'checkInput',
        'change .sp-value': 'changeInput',
        'click .toggle-fields': 'onToggleField'
      };
    }

    serialize() {
      var hbsObj = { elements: [] },
        fields = this.model.get( 'elements' );

      // current group
      var medarbejderGroup = -1;

      // map through form fields
      fields = map(fields, function(field){
        var i, options, _default, selectOpt, foundItem, foundOption,
          selectBox = '',
          htmlInput = '';

        // create form imputs depending on field type
        switch ( field.type ) {

        // show labels only. cannot change values
        case 0:
          // update html input
          htmlInput = '<p class="form-control-static sp-value" data-col="' + field.col +'" data-type="' + field.type + '">' + field.val + '</p>';
          break;
        case 1:
        case 11:
          htmlInput = '<input type="number" class="form-control sp-value" name="' + field.label.value +
            '" data-col="' + field.col +
            '" data-findex="' + field.findex +
            '" data-type="'+ field.type +
            '" placeholder="' + field.label.value +
            '" value="' + field.val + '">';
          break;
        case 3:
          // update html input
          htmlInput = '<p class="form-control-static datepicker sp-value" data-col="' + field.col + '" data-type="' + field.type + '">';

          // check if value
          if ( field.val ) {

            // update html input
            htmlInput += field.val;
          }

          // update html input
          htmlInput += '</p>';
          break;
        case 4:

          // checked support
          var checkedState = field.val ? 'checked' : '';

          // update html input
          htmlInput =
            '<div class="sp-value" data-type="' + field.type + '">' +
              '<input type="checkbox" class="modal-form-checkmark" name="' + field.label.value +
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

            // get options
            options = JSON.parse( field.options );
          } catch( e ){

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

          // check default medarbejder
          if ( _default ) {

            // update field
            field.val = selectOpt[0].key;

            // update dirty
            field.dirty = true;
          } else {

            // check val
            if ( field.val ) {
              foundOption = false;

              // get the key for the current val
              for(i=0; i<selectOpt.length; i++) {
                if (selectOpt[i].key == field.val) {

                  // update found flag
                  foundOption = true;

                  // get found item
                  foundItem = selectOpt.splice( i, 1, {
                    key: 'select',
                    value: 'Select'
                  });

                  // insert found item
                  selectOpt.unshift( foundItem[0] );

                  // break loop
                  break;
                }
              }

              // check found option flag
              if ( !foundOption ) {
                selectOpt.unshift({
                  key: 'select',
                  value: 'Select'
                });
              }
            } else {

              // update select options
              selectOpt.unshift({
                key: 'select',
                value: 'Select'
              });
            }
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
        case 15:

          try{

            // get options
            options = JSON.parse( field.options );
          } catch( e ){

            // resume
            return;
          }

          // create select input
          selectOpt = utils.createSelectInput( options, false );

          // check val
          if ( typeof field.val == 'number' || field.val ) {

            // update dirty
            field.dirty = true;

            // get the key for the current val
            for(i=0; i<selectOpt.length; i++) {
              if (selectOpt[i].key == field.val) {

                // update select options
                foundItem = selectOpt.splice( i, 1 );

                // update found item
                selectOpt.unshift( foundItem[0] );

                // skip loop
                break;
              }
            }
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
          htmlInput = '<p><select class="form-control sp-value" data-col="' + field.col +
              '" data-findex="' + field.findex +
              '" data-type="' + field.type +
              // '">' + selectBox + '</select><span class="glyphicon glyphicon-minus"></span></p>';
              '">' + selectBox + '</select></p>';
          break;
        case 16:

          try{

            // options key
            var optionsKey = field.hasOwnProperty('newOptions') ? 'newOptions' : 'options';

            // get options
            options = JSON.parse( field[optionsKey] );

            // loop through select options and clear the inputs of |0,1,1
            options = mapValues(options, function(value){

              // resume
              return value.split('|')[0];
            });
          } catch( e ){

            // resume
            return;
          }

          // create select input
          selectOpt = utils.createSelectInput( options, false );

          // check val
          if ( typeof field.val == 'number' || field.val ) {

            // reset found flag
            foundOption = false;

            // get the key for the current val
            for(i=0; i<selectOpt.length; i++) {
              if (selectOpt[i].key == field.val) {

                // update found flag
                foundOption = true;

                // get found item
                foundItem = selectOpt.splice( i, 1, {
                  key: 'select',
                  value: 'Select'
                });

                // update select options
                selectOpt.unshift( foundItem[0] );

                // skip loop
                break;
              }
            }

            // check found option
            if ( !foundOption ) {

              // reset new value
              field.val = '';

              // update options
              selectOpt.unshift({
                key: 'select',
                value: 'Select'
              });
            }
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
        case 17:

          // update html input
          // htmlInput = '<p class="form-control-static sp-value" data-col="' + field.col +'" data-type="' + field.type + '">' + field.val + '</p>';
          htmlInput = field.val;
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

      // update fields
      this.model.set( 'elements', fields );

      // update handlebars object
      hbsObj.elements = fields;

      // resume
      return hbsObj;
    }

    beforeRender() {

      // reset medarbejder done flag
      this.medarbejderDone = false;
    }

    afterRender() {
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

    updateField( value ) {

      // get focused input and update its value
      this.$el.find( 'input:focus' ).val( value ).trigger( 'change' );
    }

    updateDate( event ) {

      // newly added event handlers
      // event.preventDefault();
      event.stopPropagation();

      // local vars
      var value,
        fields      = this.model.get( 'elements' ),
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
        if ( value == currentVal ) {

          // resume
          return false;
        }

        // update innerHTML
        $el.text( value );
      }

      // map through each field
      fields = map(fields, function(field){

        // filter criteria
        if ( field.col == cIndex ) {

          // update field value
          field.val = value;

          // update field dirty
          field.dirty = true;
        }

        // resume
        return field;
      });

      // update elements
      this.model.set( 'elements', fields );
    }

    serializeForm() {
      var error = {
        col: -1,
        visible: false,
        title: '',
        message: ''
      };

      // get errors
      var errors = this.getErrorBy();

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
        return false;
      }

      // resume
      return this.model.get( 'elements' );
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
        if ( this.focusNext( event ) ) {

          // resume
          return;
        }
      }
    }

    focusNext( event ) {
      var keycode = ( event.keyCode ? event.keyCode : event.which );

      // on enter
      if ( keycode == 13 ) {
        event.preventDefault();
        event.stopPropagation();

        // get current field index
        var currentField = $( event.currentTarget ).data( 'findex' );

        // find next field
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
        col = parseInt( $input.data( 'col' ), 10 ),
        type = parseInt( $input.data( 'type' ), 10 );

      // check if input should be a number
      if ( type == 1 || type == 7 || type == 11) {
        return this.checkNumberInput( $input, col );
      }

      return;
    }

    changeInput( event ) {
      var value,
        $input = $( event.target ),
        cIndex = parseInt( $input.data( 'col' ), 10 ),
        iClick = parseInt( $input.data( 'type' ), 10 );

      // checkbox input has changed
      if ( iClick == 4 ) {

        // get value
        value = $input.prop( 'checked' ) ? 1 : 0;
      } else {
        value = trim( $input.val() );

        // empty input string
        if ( !value ) return false;
      }

      // labels
      var t1 = session.get( 'sp_lang', 'SP_Toast1') || Language.toast[1][this.lang];

      // validate input type
      if ( iClick == 1 || iClick == 4 || iClick == 5 || iClick == 7 || iClick == 11 ) {
        value = utils.toNumber( value );
        if ( isNaN(value) ) {
          return $.publish( 'toast', [2, $input.val() + t1] );
        }
      }

      // should refresh
      if ( this.updateValue(cIndex, value) ) {

        // rerender view
        this.render();
      }
    }

    updateValue( cIndex, value ) {
      var group, shouldRefresh;

      // get date format
      var dateFormat = session.get( 'settings', 'dateFormat' );

      // get old fields
      var fields = this.model.get( 'elements' );

      // map through
      map(fields, function(field){

        // filter criteria
        if ( field.col == cIndex ) {

          // dropdown
          if ( field.type == 15 || field.type == 16 && value !== 'select' ) {

            // convert value to an integer
            value = parseInt( value, 10 );
          }

          // update field value
          field.val = value;

          // update field dirty value
          field.dirty = true;

          // save group
          group = field.group;

          // check iCLick
          if ( field.type == 15 ) {

            // search for field 16
            for( var i=0; i<fields.length; i++ ) {
              if ( fields[i].type == 16 ) {

                // get possible options
                var possibleOptions = getOptions( fields[i].options, value );

                // check if possible options is an empty object
                if ( isEmpty(possibleOptions) ) {

                  // delete value
                  fields[i].val = '';

                  // update options
                  fields[i].newOptions = fields[i].options;
                } else {

                  // update options
                  fields[i].newOptions = JSON.stringify(possibleOptions);
                }

                // update should refresh
                shouldRefresh = true;

                // skip loop
                break;
              }
            }
          }
        }
      });

      // should update date
      if ( typeof group !== 'undefined' ) {

        // map through
        map(fields, function(field){

          // check field group
          if ( group !== field.group ) return;

          // filter criteria
          if ( field.type == 3 && !field.val ) {

            // update field value
            // field.val = Moment().format( dateFormat ).toString();
            field.val = DateFormat.asString( dateFormat, new Date() );

            // update field dirty
            field.dirty = true;

            // should refresh form view
            shouldRefresh = true;
          }
        });

        // update elements model
        this.model.set( 'elements', fields );
      }

      // resume
      return shouldRefresh;
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

      // labels
      var t1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[this.lang];
      var t2 = session.get( 'sp_lang', 'SP_Toast1') || Language.toast[1][this.lang];

      // it's not a number
      if ( isNaN(number) ) {

        // not a valid number
        $input.closest( 'div.form-group' ).removeClass( 'has-success' ).addClass( 'has-error' );

        // set error
        this.setError({
          col: col,
          visible: true,
          title: 'SmartPigs ' + capitalize( t1 ) + ': ',
          message: value + ' ' + t2
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
      var args = Array.prototype.slice.call( arguments ),
        errors = cloneDeep( this.model.get('errors') );

      // validate arguments
      if ( args.length < 2 ) return errors;

      // filter through errors
      errors = filter(errors, function( err ){

        // filter criteria
        return err[ attr ] == value;
      });

      // check length
      if ( errors.length ) {

        // resume
        return errors[ 0 ];
      }

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

      // get all errors
      var errors = this.getErrorBy();

      // insert error at specific position
      errors.splice( err.col, 0, err );

      // update errors
      this.model.set( 'errors', errors );
    }

    onToggleField( event ) {

      // prevent default event programatically
      event.preventDefault();

      // get model
      var elements = this.model.get( 'elements' );

      // other vars
      var i;

      // get element
      var $toggleLabel = this.$( event.currentTarget );

      // get col, index and group
      var col = parseInt( $toggleLabel.data( 'col' ) );

      // check if it's a number
      if ( isNaN(col) ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs Error: not a valid column number!'] );
      }

      // field label
      var fLabel = 'Show hidden fields';

      // should refresh form
      var shouldRefresh = false;

      // check col
      if ( col < 0 ) {

        // update refresh state
        shouldRefresh = true;

        // update toggleHiddenFields state
        this.toggleHiddenFields = !this.toggleHiddenFields;

        // check toggle state - show hidden fields
        if ( this.toggleHiddenFields ) {

          // loop through elements
          for ( i=1; i<elements.length; i++ ) {

            // update flag
            elements[i].visible = true;
          }

          // update elem 0 visibility
          elements[0].visible = false;
        }
      } else {

        // update toggleHiddenFields state
        this.toggleHiddenFields = false;

        // loop through elements
        for ( i=0; i<elements.length; i++ ) {

          // check elements column
          if ( elements[i].col == col ) {

            // toggle flag and skip loop
            elements[i].visible = !elements[i].visible;

            // should refresh
            shouldRefresh = true;

            // skip loop
            break;
          }
        }

        // update elem 0 visibility
        elements[0].visible = true;
      }

      // define field value based on toggle hidden value
      var fValue = '<a class="toggle-fields" data-col="-1"><span class="glyphicon glyphicon-minus" aria-hidden="true"></span> ' + fLabel +'</a>';

      // update first element field value
      elements[0].val = fValue;
      elements[0].value = fValue;

      // check if should refresh
      if ( shouldRefresh ) {

        // update elements
        this.model.set( 'elements', elements );

        // rerender form
        this.render();
      }

      // prevent default event
      // stop propagation
      return false;
    }
  };
};
