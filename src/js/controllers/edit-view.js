'use strict';

// libs
import getProp from 'get-prop';

// local vars
var lang;

// exports
export default( $, axios, Base64, Backbone, Const, Language, utils, session,
  editText, editNumber, selectModal, editDropdown ) => {

  // return edit view handler
  return function(evOptions) {
    var $cell, hash, setup, sModal, newValue, selectOpt;

    // get current app language
    lang = session.get( 'settings', 'lang' );

    // get date format
    var dateFormat = session.get( 'settings', 'dateFormat' ).toLowerCase();

    // get table model
    var tModel = this.model.toJSON();

    // edit current row
    if ( tModel.tEdit ) {

      // publish event to interested modules
      this.trigger( 'edit-row', evOptions.rowId, evOptions.rIndex );

      // resume
      return;
    }

    // get real column index
    var cIndex = evOptions.cIndex;

    // check if cell is editable
    if ( tModel.tRows[evOptions.rIndex].data[evOptions.cIndex] == '\u200B' ) {

      // toast message
      var mb8 = session.get( 'sp_lang', 'SP_ModalsBody8') || Language.modals.body8[lang];

      // toast
      $.publish( 'toast', [ 2, mb8 ] );

      // resume
      return;
    }

    // toast message
    var t4 = session.get( 'sp_lang', 'SP_Toast4') || Language.toast['4'][lang];

    // check event type
    switch ( evOptions.tEvent ) {
    case 'tap':
    case 'click':

      // check column type
      switch( evOptions.iClick ) {
      // fake checkmark
      case -1:

        // get table cell
        $cell = this.getTableCell( evOptions.rIndex + 1, cIndex );

        // check if checkmark was marked or not
        newValue = $cell.find( 'i' ).hasClass('fa-square-o') ? 1 : 0;

        // get old value
        var oldValue = this.getValue(evOptions.rIndex, evOptions.cIndex);

        // new value is the same => resume
        if ( newValue == oldValue ) return;

        // trigger update
        // $.publish( 'update-checked', [{
        $.publish( 'update-view', [{
          tableId: evOptions.tableId,
          rIndex: evOptions.rIndex,
          cIndex: evOptions.cIndex,
          rowId: evOptions.rowId,
          iClick: evOptions.iClick,
          newValue: newValue
        }] );
        break;

      // number + text type
      case 1:
      case 2:
      case 6:
      case 5:
      case 7:
      case 11:

        // log
        console.warn( 'should never get here: ' + evOptions.iClick );
        break;

      case 66:
      case 77:
      case 10:
      case 1111:

        // define setup
        setup = {
          placeholder: '&nbsp;',
          height     : '14px',
          width      : '100%',
          tableId    : evOptions.tableId,
          rowId      : evOptions.rowId,
          iGroup     : evOptions.iGroup,
          iClick     : evOptions.iClick,
          rIndex     : evOptions.rIndex,
          cIndex     : evOptions.cIndex,
          name       : 'active-field'
        };

        // get table cell (increment rIndex to account for the fake height row)
        $cell = this.getTableCell(evOptions.rIndex + 1, cIndex);

        // choose jEditable callback at runtime
        if ( evOptions.iClick == 1 || evOptions.iClick == 7 || evOptions.iClick == 11 ) {

          // update jEditable options
          setup.cssclass = 'alignRight';

          // trigger jEditable plugin
          $cell.editable( editNumber, setup ).trigger( 'click' );
        } else {

          // trigger jEditable plugin
          $cell.editable( editText, setup ).trigger( 'click' );
        }
        break;

      // date
      case 3:

        // get table cell
        $cell = this.getTableCell(evOptions.rIndex + 1, cIndex);

        // check if datepicker plugin was not already called
        // this change doesn't fix the issue of triggering 'show' 2 times
        // see bug here: https://github.com/eternicode/bootstrap-datepicker/issues/912
        if ( $.isEmptyObject( $cell.data() ) ) {

          // apply datepicker plugin
          $cell.datepicker({
            language: session.get( 'settings', 'lang' ),
            format: dateFormat,
            todayBtn: 'linked',
            autoclose: true,
            todayHighlight: true
          });
        }

        // show datepicker
        $cell.datepicker( 'show' );
        break;

      // checkmark
      case 4:

        // get table cell
        $cell = this.getTableCell(evOptions.rIndex + 1, cIndex);

        // check if checkmark was marked or not
        newValue = $cell.find( 'i' ).hasClass('fa-square-o') ? 1 : 0;

        // new value is the same => resume
        if ( newValue == this.getValue(evOptions.rIndex, evOptions.cIndex) ) return;

        // trigger update
        $.publish( 'update-view', [{
          tableId: evOptions.tableId,
          rIndex: evOptions.rIndex,
          cIndex: evOptions.cIndex,
          rowId: evOptions.rowId,
          iClick: evOptions.iClick,
          newValue: newValue
        }] );
        break;

      // dropdown
      case 55:
      case 15:

        // get dropdown options
        selectOpt = getProp( tModel.tHead[tModel.properties.lastHeaderIdx].th[evOptions.cIndex], ['sDropDown'], '');

        // check length
        if ( !selectOpt ) {

          // toast
          $.publish( 'toast', [ 2, t4 ] );

          // resume
          return;
        }

        // if touch and mobile
        if ( Modernizr.touch && Modernizr.mobile || Modernizr.smartpigs ) {

          // launch select modal
          sModal = selectModal({
            modalName  : 'select_col_' + cIndex,
            select     : selectOpt,
            colName    : 'colName',
            tableId    : evOptions.tableId,
            rowId      : evOptions.rowId,
            iClick     : evOptions.iClick,
            rIndex     : evOptions.rIndex,
            cIndex     : evOptions.cIndex,
            oldValue   : this.getValue(evOptions.rIndex, evOptions.cIndex),
            keyValue   : 1
          });

          // render modal
          sModal.render();
        } else {
          try {

            // parsedOptions = JSON.parse( selectOpt.replace(/""/g, '') );
            selectOpt = JSON.parse( selectOpt );
          } catch ( e ) {

            // toast message
            var t5 = session.get( 'sp_lang', 'SP_Toast5') || Language.toast['5'][lang];

            // toast
            $.publish( 'toast', [ 3, t5 + ' @controllers->Progeny->cellEvent()' ] );

            // resume
            return;
          }

          // get table cell
          $cell = this.getTableCell(evOptions.rIndex + 1, cIndex);

          // define setup
          setup = {
            placeholder: '&nbsp;',
            data       : selectOpt,
            type       : 'select',
            height     : '14px',
            width      : '100%',
            tableId    : evOptions.tableId,
            rowId      : evOptions.rowId,
            iClick     : evOptions.iClick,
            rIndex     : evOptions.rIndex,
            cIndex     : evOptions.cIndex,
            value      : this.getValue(evOptions.rIndex, evOptions.cIndex)
          };

          // jEditable select
          $cell.editable( editDropdown, setup ).trigger( 'click' );
        }
        break;

      // load task view
      case 8:

        // get current fragment
        var fragment = Backbone.history.fragment;

        // check fragment
        if ( fragment.indexOf('n/') < 0 ) {

          // update fragment
          fragment = [];
        } else {

          // get fragment
          fragment = JSON.parse( Base64.decode(fragment.split('n/')[1]) );
        }

        // replace route if not found
        var replace = false;

        // current options
        var i, _rowId, _cIndex, _requestKey;

        // search for current options in the fragment
        for( i=0; i<fragment.length; i++ ) {

          // check replace
          if ( replace ) break;

          // get options
          _rowId = getProp( fragment[i], ['rowId'], false );
          _cIndex = getProp( fragment[i], ['cIndex'], false );
          _requestKey = getProp( fragment[i], ['requestKey'], false );

          // extra check
          if ( _rowId !== evOptions.rowId || _cIndex !== evOptions.cIndex || _requestKey !== evOptions.tableId ) continue;

          // update flag
          replace = true;
        }

        // check replace
        if ( !replace ) {

          // define default request key
          var rKey = evOptions.tableId;

          // check if '/' is to be found in table id
          if ( evOptions.tableId.indexOf('/') > 0 ) {

            // cleanup request key
            rKey = evOptions.tableId.substring( 0, evOptions.tableId.indexOf('/') );
          }

          // update fragment
          fragment.push({
            rowId: evOptions.rowId,
            cIndex: evOptions.cIndex,
            // requestKey: evOptions.tableId
            requestKey: rKey
          });
        }

        // encode fragment
        hash = Base64.encode( JSON.stringify(fragment) );

        // navigate
        Backbone.history.navigate( 'n/' + hash, { trigger: true, replace: replace } );
        break;

      // load pdf view
      case 9:

        // check if pdf viewer is installed
        if (session.get('acrobatInfo', 'installed')) {

          // base64 options hash
          hash = Base64.encode(JSON.stringify({
            rowId: evOptions.rowId,
            requestKey: evOptions.tableId
          }));

          // navigate
          Backbone.history.navigate( 'pdf/' + hash, { trigger: true } );
        } else {

          // launch spinner
          $.publish( 'spinner', [true] );

          // init server address
          var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

          // define full url request
          var url = server_address + 'get.html?' + session.get( 'layouts', 'sessionKey' ) + '?' + evOptions.tableId + '/' + evOptions.rowId;

          // define data
          var data = utils.getLayoutBy( 'requestKey', evOptions.tableId );

          // axios post config
          var config = {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          };

          // Make a request for a user with a given ID
          axios
            .post(url, data, config)
            .then(function (response) {

              // check if android
              if ( Modernizr.smartpigs ) {

                // download pdf directly with android
                Android.openPdfFrom( server_address + response.data );
              } else {

                // define virtual button
                var vButton = $( '#virtualButton' );

                // get resource url
                var resourceAddress = '/' + response.data;

                // update virtual button and trigger click
                vButton.attr( 'href', resourceAddress );

                // attach event listener
                vButton.click(function(e) {

                  // prevent default event
                  e.preventDefault();

                  // open resource address
                  global.location = resourceAddress;
                }).trigger( 'click' );
              }

              // hide spinner
              $.publish( 'spinner', [false] );
            })
            .catch(function () {

              // hide spinner
              $.publish( 'spinner', [false] );

              // toast
              $.publish( 'toast', [3, 'Error occured when downloading *.pdf file!'] );
            });
        }
        break;
      }
      break;
    case 'taphold':
    case 'contextmenu':

      // if tap and hold on iClick 6 or 7 select modal with a dropdown
      if ( evOptions.iClick==6 || evOptions.iClick==7 || evOptions.iClick==10 ) {

        // check if has sDropDown
        if ( getProp(tModel.tHead[tModel.properties.lastHeaderIdx].th[evOptions.cIndex], ['sDropDown'], '') ) {

          // get dropdown options
          selectOpt = tModel.tHead[tModel.properties.lastHeaderIdx].th[evOptions.cIndex].sDropDown;

          // prevent error if no dropdown options
          if ( !selectOpt ) {

            // toast
            $.publish( 'toast', [ 2, t4 ] );

            // resume
            return;
          }

          // launch select modal
          selectModal({
            modalName  : 'select_col_' + cIndex,
            select     : selectOpt,
            colName    : 'colName',
            tableId    : evOptions.tableId,
            rowId      : evOptions.rowId,
            iClick     : evOptions.iClick,
            rIndex     : evOptions.rIndex,
            cIndex     : evOptions.cIndex,
            oldValue   : this.getValue(evOptions.rIndex, evOptions.cIndex),
            keyValue   : 0
          });
        } else {

          // toast
          $.publish( 'toast', [ 2, t4 ] );
        }
      }
      break;
    }
  };
};
