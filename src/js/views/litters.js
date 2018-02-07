'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, extend, filter, assign, reverse, isArray, cloneDeep, capitalize } from 'lodash';

// exports
export default ($, DateFormat, Layout, Const, DbConnection, Language, template, Row,
  FormModel, DialogModel, DetailsModel, FormView, DialogView, DetailsView, utils, session) => {

  // return litters history view
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // no wrapping element
        el: false,

        // template function
        template: template,

        // define view events
        events: {
          'click .browse-litters': 'onBrowseLitters',
          'click .list-details': 'showDetails',
          'click .addNewEvent': 'addEvent'
        }
      }, o));
    }

    initialize() {

      // reset defaults
      this.resetDefaults();

      // listen to the model
      this.listenTo( this.model, 'change', this.render, this );

      // listen for positive/negative events
      this.on( 'positive', this.onPositive.bind(this) );
      this.on( 'negative', this.onNegative.bind(this) );
    }

    resetDefaults() {

      // set up defaults
      this.litterNo = 0;
      this.maxLitters = 0;

      // history length
      this.hLength = 0;

      // current litter index
      this.cLitterIdx = 0;
    }

    // render
    serialize() {

      // labels
      var t5 = session.get( 'sp_lang', 'SP_ButtonNewEvent') || Language.button.newEvent[this.lang];
      var t6 = session.get( 'sp_lang', 'SP_LabelsLittersHistory') || Language.labels.littersHistory[this.lang];

      var th, tHead, tRows, currentLitterNo, currentLitterRows,
        rNo    = [],
        events = [],
        hbsObj = {
          ev: [],
          addEvent: false,
          newEvent: t5,
          title: t6,
          events: []
        },
        layout = this.model.get( 'layout' ),
        data   = this.model.get( 'data' );

      // get litter rows
      tRows = getProp( data, ['litters', 'tr'], [] );

      // get unique row numbers
      map(tRows, function( tRow ){

        // filter through row numbers to check
        // if the current row number already belongs to it
        var fNo = filter(rNo, function(n){

          // filter criteria
          return n == tRow.no;
        });

        // check filtered array
        if ( !fNo.length ) {

          // update row numbers
          rNo.push( tRow.no );
        }
      });

      // get headers
      th = getProp( layout, ['thead'], [] );

      // get last header
      tHead = getProp( th[th.length-1], ['th'], [] );

      // fail early
      if ( !tRows.length || !th.length ) return hbsObj;

      // log
      // console.log( rNo );

      // check max litters defaults
      if ( !this.hLength ) {

        // update max litters
        this.hLength = rNo.length;

        // update curent litter index
        this.cLitterIdx = this.hLength - 1;
      }

      // get current litter number
      currentLitterNo = rNo[ this.cLitterIdx ];

      // update current litter number
      hbsObj.current = currentLitterNo;

      // get litter rows for current litter number
      currentLitterRows = filter(tRows, function( tRow ){ return tRow.no == currentLitterNo; });

      // validate current rows
      if ( !currentLitterRows.length ) return hbsObj;

      // filter current litter rows to get available events
      filter( currentLitterRows, function( tRow ){

        // original row index
        var rowIndex = tRow.rIndex;

        // skip empty rows
        if ( !getProp(tRow, ['data'], []).length ) return false;

        // map through each row column data
        map(tRow.data, function( cData, cIdx ){
          var sTitle, iGroup, iClick, readOnly, topHeader, isDateCol;

          // validate column data (skip column)
          if ( !cData || cData == '\u200B' ) return;

          // get vars
          iClick    = tHead[cIdx].iClick;
          readOnly  = tHead[cIdx].bReadOnly;
          iGroup    = tHead[cIdx].iGroup;
          isDateCol = iClick == 3 || iClick == 11;

          // get top header that has the same iGroup
          topHeader = filter(th[0].th, function(tH){

            // filter criteria
            return tH.iGroup == iGroup && tH.sTitle;
          });

          // skip date columns, readOnly columns or empty header columns
          if ( readOnly || !isDateCol || !topHeader.length ) return;

          // get top headeer title
          sTitle = topHeader[0].sTitle;

          // update current events object
          events.push({
            row:      rowIndex,
            col:      cIdx,
            date:     cData,
            type:     iClick,
            editable: true,
            title:    sTitle
          });
        });
      });

      // reverse current litter rows
      reverse( currentLitterRows );

      // update hbs events
      hbsObj.events = events;

      // filter litter rows to get available events
      filter( currentLitterRows, function( tRow ){

        // original row index
        var rowIndex = tRow.rIndex;

        // skip empty data rows
        if ( !getProp(tRow, ['data'], []).length ) return false;

        // map through each row column data
        map(tRow.data, function( cData, cIdx ){

          // validate column data value
          // TODO: add support for 1000 day format
          if ( cData || cData.length && cData !== '\u200B' ) return;

          // get vars
          var iClick   = tHead[cIdx].iClick;
          var iGroup   = tHead[cIdx].iGroup;
          var readOnly = tHead[cIdx].bReadOnly;

          var isNotDateColumn = iClick !== 3 && iClick !== 11;

          // skip non-date columns or read only columns
          if ( isNotDateColumn || readOnly ) return;

          // get top header that has the same iGroup
          var topHeader = filter( th[0].th, function( tH ){

            // filter criteria
            return tH.iGroup == iGroup && tH.sTitle;
          });

          // no topHeader with the same iGroup -> skip column
          if ( !topHeader.length ) return;

          // get top header title
          var sTitle = topHeader[0].sTitle;

          // create single event
          var ev = {
            row: rowIndex,
            col: cIdx,
            type: iClick,
            group: iGroup,
            title: sTitle,
            editable: true
          };

          // update current events object
          hbsObj.ev.push( ev );

          // log
          // console.log( 'column type = ' + iClick );
          // console.log( 'column ' + cIdx + ' value = ' + cData );
        });
      });

      // should calculate new-events list (always)
      if ( hbsObj.ev.length ) {

        // update add event button
        hbsObj.addEvent = true;
      }

      // check number of events
      if ( hbsObj.events.length ) {

        // get last event
        var lastEvent = hbsObj.events[ hbsObj.events.length - 1 ];

        // check last event
        if ( lastEvent.title.toLowerCase() == 'faring' || lastEvent.title.toLowerCase() == 'farrowing' ) {

          // update model
          this.model.set({
            assignTab: 1,
            activeLit: this.cLitterIdx
          });
        }
      } else {

        // update model
        this.model.set( 'assignTab', 0 );
      }

      // resume
      return hbsObj;
    }

    setData( data ) {
      this.resetDefaults();
      this.model.set( data );
    }

    onBrowseLitters( event ) {
      event.preventDefault();
      event.stopPropagation();

      var direction = $( event.currentTarget ).data( 'direction' );

      // browse with direction
      this.browseLitters( direction );
    }

    showDetails( event ) {
      event.preventDefault();
      event.stopPropagation();

      // labels
      var t8 = session.get( 'sp_lang', 'SP_ButtonUpdate') || Language.button.update[this.lang];
      var t9 = session.get( 'sp_lang', 'SP_ButtonRemove') || Language.button.remove[this.lang];

      var $el, $target, elIndex, row, col, data, layout, iGroup, hLength, isOnline, isLastEvent;
      var tHead, tRow, title, detailsModel, $detailsEl, detailsView,
        details = {
          title: '',
          fields: [],
          update: capitalize( t8 ),
          delete: ''
        };

      // get target element
      $target = $( event.currentTarget );

      // get anchor element
      $el     = $target.find( 'a' );

      // get element info
      row     = $el.data( 'row' );
      col     = $el.data( 'col' );
      elIndex = $el.data( 'index' );

      // get layout and original data
      layout = this.model.get( 'layout' );
      data   = this.model.get( 'data' );

      // get actual row
      tRow = data.litters.tr[ row ];

      // get headers length
      hLength = layout.thead.length;

      // get last header
      tHead = layout.thead[ hLength - 1 ].th;

      // get current column group
      iGroup = tHead[ col ].iGroup;

      // get top header title
      map(layout.thead[0].th, function(th){

        // check title
        if ( title || !th.sTitle ) return;

        // check group
        if ( th.iGroup == iGroup ) {

          // set title
          title = th.sTitle;
        }
      });

      // check title
      if( !title ) return;

      // get online state
      isOnline = session.get('app', 'connection') == Const.NET_CONNECTED;

      // loop through row data to get the requested info
      map(tRow.data, function(cData, cIdx){
        // column group
        var cGroup = tHead[cIdx].iGroup;

        // check column group
        if ( iGroup !== cGroup ) return;

        // get real length
        var len = details.fields.length;

        // define field type
        var fType = 'text';

        // check iClick
        if ( tHead[cIdx].iClick == 1 || tHead[cIdx].iClick == 11 ) {

          // update field type
          fType = 'number';
        }

        // update fields
        details.fields.push({
          idx: len,
          row: row,
          col: cIdx,
          data: cData == '\u200B' ? '' : cData,
          type: tHead[cIdx].iClick,
          title: tHead[cIdx].sTitle,
          iGroup: tHead[cIdx].iGroup,
          fType: fType
        });
      });

      // get is last event state
      isLastEvent = $target.data( 'last' );

      // if online and last event on the last litter
      // show delete button
      if ( this.cLitterIdx == this.hLength - 1 && isOnline && isLastEvent ) {

        // update delete
        details.delete = t9;
      }

      // check details fields
      if ( !details.fields.length ) return;

      // create new details model
      detailsModel = new DetailsModel( details );

      // create new details view
      detailsView = new DetailsView({
        model: detailsModel,
        lang: this.lang
      });

      // listen for 'update' and 'delete' event
      detailsView.on( 'update', this.onUpdateEvent.bind(this) );
      detailsView.on( 'delete', this.onDeleteEvent.bind(this) );

      // get details element
      $detailsEl = $( '.details-' + elIndex );

      // check if this details element is active
      if ( $detailsEl.hasClass('active') ) {

        // inactivate details element, slideit up and resume
        return $detailsEl.removeClass( 'active' ).slideUp( 'fast' );
      }

      // cache other details elements
      var $details = $( '.details' );

      // check is active
      if ( $details.hasClass('active') ) {

        // slide everything up
        $details.removeClass( 'active' ).slideUp( 100 );
      }

      // make active
      $detailsEl.addClass( 'active' );

      // render details view
      detailsView
        .render()
        .promise()
        .done(function(){

          // set view
          this.setView( '.details-' + elIndex, detailsView );

          // append details view
          $detailsEl.html( detailsView.$el ).slideDown( 'fast' );
        }.bind(this));
    }

    // update handler
    onUpdateEvent( fields ) {
      var tRow, isOnline,
        _self  = this,
        data   = this.model.get( 'data' ),
        layout = this.model.get( 'layout' ),
        rIndex = fields[ 0 ].row;

      // get data for the whole field row
      tRow = new Row( data.litters.tr[rIndex] );

      // update data
      map(fields, function(field){

        // update value
        tRow.setValue( field.col, field.newVal, true );
      });

      // get online state
      isOnline = session.get('app', 'connection') == Const.NET_CONNECTED;

      // manage new row (update mode, copy data model)
      data = this.manageRow( tRow, true );

      // launch spinner
      $.publish( 'spinner', [true] );

      // update data
      this
        .syncData( layout, data, isOnline )
        .then(function( rowId ){

          // hide spinner
          $.publish( 'spinner', [false] );

          if ( isOnline ) {
            if ( !tRow.clearDirty() ) {

              // toast and resume
              return $.publish( 'toast', [2, 'cannot clear dirty row with id = ' + tRow.getId()] );
            }

            // update id
            tRow.setId( rowId );

            // manage new row (update mode, copy data model)
            data = _self.manageRow( tRow, true );
          }

          // rerender top view
          _self.render();
        })
        .catch(function(err){
          var errSource = getProp( err, ['source'], 'Database' );

          // hide spinner
          $.publish( 'spinner', [false] );

          // labels
          var t7 = session.get( 'sp_lang', 'SP_LabelsLittersHistory') || Language.index.errorMsg6[_self.lang];

          // toast
          $.publish( 'toast', [2, errSource + ' ' + capitalize( t7 ) + ': ' + (err.message || err.toString()) + ' @LittersHistory:onUpdateEvent!'] );
        });
    }

    onDeleteEvent(fields) {
      var firstColumnIdx,
        _self = this;

      // get iGroup
      var iGroup = fields[0].iGroup;

      // get data and layout
      var data   = this.model.get( 'data' );
      var layout = this.model.get( 'layout' );

      // get first header
      var thead = getProp( layout, ['thead'], [] );

      // get last header
      var thL = getProp( thead[thead.length-1], ['th'], [] );

      // loop through last header
      map(thL, function(hL, idxE){
        // check iGroup
        if ( hL.iGroup == iGroup && typeof firstColumnIdx == 'undefined' ) {

          // check idxE
          if ( !idxE ) {
            firstColumnIdx = 1;
          } else {
            firstColumnIdx = idxE;
          }
        }
      });

      // check if we got the corrent column index
      if ( typeof firstColumnIdx == 'undefined' ) return;

      // update data
      data.litters.tr[fields[0].row].deleted = Math.pow( 2, firstColumnIdx );

      // launch spinner
      $.publish( 'spinner', [true] );

      // update data
      this
        .syncData( layout, data, true )
        .then(function(){

          // hide spinner
          $.publish( 'spinner', [false] );

          // request updated sowcard
          _self.trigger( 'request-sowcard', [data.number] );
        })
        .catch(function(err){
          var errSource = getProp( err, ['source'], 'Database' );

          // hide spinner
          $.publish( 'spinner', [false] );

          // labels
          var t7 = session.get( 'sp_lang', 'SP_LabelsLittersHistory') || Language.index.errorMsg6[_self.lang];

          // toast
          $.publish( 'toast', [2, errSource + ' ' + capitalize( t7 ) + ': ' + (err.message || err.toString()) + ' @LittersHistory:onUpdateEvent!'] );
        });
    }

    addEvent(event) {
      event.preventDefault();
      event.stopPropagation();

      var row, col, type, group, litterNo;

      // cache element
      var $el = $( event.currentTarget );

      // get info
      row   = $el.data( 'row' );
      col   = $el.data( 'col' );
      type  = $el.data( 'type' );
      group = $el.data( 'group' );

      // on desktop only
      if ( !Modernizr.mobile ) {

        // log
        console.log( 'row = ' + row + ', col = ' + col + ', type = ' + type + ', group = ' + group );
      }

      var _self   = this,
        layout    = this.model.get( 'layout' ),
        fIndex    = 0,
        fields    = [],
        firstDate = false;

      // get date format
      var dateFormat = session.get( 'settings', 'dateFormat' );

      // get headers
      var th = getProp( layout, ['thead'], [] );

      // get header length
      var thLength = th.length;

      // validate headers
      if ( !thLength ) return;

      // get fields from the last geader belonging to the group iGroup
      var eventFields = filter(th[thLength-1].th, function(head){

        // filter early
        if ( head.bReadOnly ) return false;

        // filter criteria
        return head.iGroup == group;
      });

      // validate event fields
      if ( !eventFields.length ) return;

      // map through last header to create form fields
      map(eventFields, function(field, index) {
        var el, value,
          dirty = false,
          labelTitle = field.sTitle;

        // column is not visible or read only
        if ( !field.bVisible ) return false;

        // check label title length
        if ( labelTitle.length > 11 ) {

          // remove extra characters from label title
          labelTitle = labelTitle.substring( 0, 12 ) + '... ';
        }

        // check field type
        // add support for first date
        if ( field.iClick == 3 ) {

          // check if field has `EntryDate` class
          if ( !firstDate || field.sClass == 'EntryDate' ) {

            // update first date flag
            firstDate = true;

            // update value
            // value = Moment().format( dateFormat ).toString();
            value = DateFormat.asString(dateFormat, new Date());

            // log
            console.log(value);

            // update dirty field
            dirty = true;
          }
        }

        // create new element
        el = {
          col: col + index,
          findex: fIndex,
          type: field.iClick,
          label: {
            class: 'col-xs-5 col-sm-5',
            value: labelTitle,
          },
          class: 'col-xs-7 col-sm-7',
          val: value || '',
          dirty: dirty,
          newVal: false
        };

        // check if field has sDropDown
        if ( getProp(field, ['sDropDown']) ) {

          // attach options attribute
          el.options = field.sDropDown.replace(/""/g, '');
        }

        // update fields
        fields.push( el );

        // update field index
        fIndex += 1;
      });

      // get litter number
      litterNo = this.litterNo;

      // get event title
      var evTitle = eventFields[0].sToplevel;

      // labels
      var b1 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[this.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[this.lang];

      // positive and negative dialog title
      var posTit = b2;
      var negTit = b1;

      // form model
      var formModel = new FormModel({ elements: fields });

      // create new form view
      var formView = new FormView({ model: formModel, lang: this.lang });

      // create dialog model
      var dialogModel = new DialogModel({
        id: 'add_row_event',
        icon: 'glyphicon-plus',
        title: evTitle,
        visible: false,
        destroy: true,
        options: {
          backdrop: 'static',
          keyboard: true,
          show: false,
          xModal: true
        },
        buttons: [{
          class: 'btn-default',
          title: negTit,
          visible: true,
          event: 'negative'
        }, {
          class: 'btn-primary',
          title: posTit,
          icon: 'glyphicon-plus',
          visible: true,
          event: 'positive'
        }]
      });

      // instantiate new dialog view
      var dialogView = new DialogView({
        model: dialogModel,
        lang: this.lang
      });

      // listen for 'positive' event
      dialogView.on('positive', function(){

        // get form data
        var serializedForm = formView.serializeForm();

        // check for form errors
        if ( !serializedForm ) {

          // hide dialog
          this.toggle();

          // resume
          return;
        }

        // define/update event options
        var opt = {
          row: row,
          col: col,
          type: type,
          group: group,
          title: evTitle.toLowerCase(),
          litterNo: litterNo
        };

        // trigger event further
        _self.trigger( 'positive', this, opt, serializedForm );
      });

      // listen for 'negative' event
      dialogView.on('negative', function(){

        // trigger add-row event further
        _self.trigger( 'negative', this );
      });

      // listen for 'visible' event
      dialogView.on('visible', function(){

        // focus first input field
        formView.focusInput();
      });

      // insert form view inside dialog view
      dialogView.setView( '.body-component', formView );

      // render dialog view
      dialogView.render();
    }

    manageRow( tRow, forReal ) {
      var data = this.model.get( 'data' );

      // check manage mode
      if ( !forReal ) {

        // get data model
        data = cloneDeep( data );
      }

      // update sowcard data
      map(data.litters.tr, function( row ){

        // check data src
        if ( tRow.getRowIndex() == row.rIndex ) {

          // overwrite table row
          extend( row, tRow.toJSON() );

          // resume
          return;
        }

        // update specific row
        if ( tRow.getId() == row.id ) {

          // overwrite table row
          extend( row, tRow.toJSON() );
        }
      });

      // update dirty
      data.isDirty = 1;

      // resume
      return data;
    }

    onPositive(dialog, options, fields) {
      var _self  = this;

      var data   = this.model.get( 'data' );
      var layout = this.model.get( 'layout' );

      // get row
      var tRow = new Row( data.litters.tr[options.row || 0] );

      // get updated row
      if ( !tRow.updateFields(fields, true) ) {

        // hide dialog
        dialog.toggle();

        // resume
        return;
      }

      var isOnline = session.get( 'app', 'connection' ) == Const.NET_CONNECTED;

      // manage new row (update mode, copy data model)
      data = this.manageRow( tRow, true );

      // launch spinner
      $.publish( 'spinner', [true] );

      // update data
      this
        .syncData( layout, data, isOnline )
        .then(function( rowId ){
          var enableTab = 0;

          // hide spinner
          $.publish( 'spinner', [false] );

          // check state
          if ( isOnline ) {

            // clear dirty
            if ( !tRow.clearDirty() ) {

              // toast and resume
              return $.publish( 'toast', [2, 'cannot clear dirty row with id = ' + tRow.getId()] );
            }

            // update id
            tRow.setId( rowId );

            // manage new row (update mode, copy data model)
            data = _self.manageRow( tRow, true );

            // validate id length
            if( rowId.length == 6 ) {

              // check if faring
              if ( rowId[4] !== -1 && rowId[5] == -1 ) {

                // enable tab
                enableTab = 1;
              }

              // update model
              _self.model.set({
                assignTab: enableTab,
                activeLit: _self.cLitterIdx
              });
            }
          }

          // toggle dialog
          dialog.hide(function(){

            // check enable tab
            if ( enableTab ) {

              // request updated sowcard
              _self.trigger( 'request-sowcard', [data.number] );
            } else {

              // rerender top view
              _self.render();
            }
          });
        })
        .catch(function(err){
          var errSource = getProp( err, ['source'], 'Database' );

          // hide spinner
          $.publish( 'spinner', [false] );

          // dialog trigger error
          dialog.model.set('error', {
            visible: true,
            title: errSource + ' ' + capitalize(  ) + ': ',
            message: err.message || err.toString()
          });

          // manually rerender
          dialog.updateError();
        });
    }

    onNegative(dialog) {

      // hide dialog
      dialog.toggle();
    }

    syncData( layout, data, isOnline ) {
      return new Promise(function(resolve, reject){
        var toSend = {},
          sowcards = [];

        // offline mode
        if ( !isOnline ) {

          // get connection
          DbConnection
            .then(function(connection) {

              // get table name
              var tableName = Const.DB_TABLES[1].name;

              // update row
              return connection.updateRow( tableName, data );
            })
            .then(function(result){

              // check if result is array
              if ( !result.length ) {

                // reject promise
                return reject({
                  type: 6,
                  source: 'Database',
                  message: 'could not update card in the database @LittersHistory:syncData!'
                });
              }

              // check if store is not dirty
              if ( !session.get('dirty', layout.requestKey) ) {

                // set dirty store
                session.set( 'dirty', layout.requestKey, 1 ).persist();
              }

              resolve( result );
            })
            .catch(function(err){

              // reject promise
              reject({
                type: 6,
                source: 'Database',
                message: err.message || err.toString()
              });
            });
        } else {

          // update sowcards
          sowcards.push( data );

          // insert layout
          toSend.layout  = layout;
          toSend.sowcards = sowcards;

          // init server address
          var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

          // ajax request, returns promise
          $.ajax({
            type: 'POST',
            url: server_address + 'send.html?' + session.get( 'layouts', 'sessionKey' ) + '?' + layout.requestKey,
            data: JSON.stringify( toSend ),
            crossdomain: true
          }).done(function(result){
            var rowId;

            if ( !result ) {

              // resolve anyway
              return resolve();
            }

            // error response
            if ( result && typeof result == 'string' && result.charAt(0) == '!' ) {

              // reject promise
              return reject({
                type: 2,
                source: 'Server',
                message: result.substring( 1, result.length )
              });
            }

            // try to parse array
            try {

              // get rowId
              rowId = JSON.parse( result );
            } catch( e ) {

              // log
              console.log( e.toString() );

              // reject promise
              return reject({
                type: 2,
                source: 'Server',
                result: result,
                message: 'id = ' + result + ' not valid'
              });

              // log
              // $.publish( 'toast', [2, 'id = ' + result + ' not valid!'] );
            }

            // validate array
            if ( !isArray(rowId) ) {

              // reject promise
              return reject({
                type: 2,
                source: 'Server',
                result: result,
                message: 'id = ' + result + ' not valid'
              });
            }

            // resolve promise
            resolve( rowId );
          }).fail(function(){
            var connectionState = utils.ajaxFail.apply( undefined, arguments );

            // reject promise and resume
            reject({
              type: 5,
              source: 'Server',
              message: 'No connection!',
              connectionState: connectionState
            });
          });
        }
      });
    }

    browseLitters( direction ) {
      if ( direction == 'prev' ) {

        // check if not last litter
        if ( this.cLitterIdx ) {

          // update litterNo
          this.cLitterIdx -= 1;

          // rerender
          this.render();

          // resume
          return;
        }

        // labels
        var b1 = session.get( 'sp_lang', 'SP_EndLitters') || Language.modals.title12[this.lang];

        // toast
        $.publish( 'toast', [2, b1] );

        // resume
        return;
      }

      // if last litter number and next
      if ( this.cLitterIdx == this.hLength - 1 ) {

        // show full sowcard
        this.trigger( 'show-fullsowcard' );

        // resume
        return;
      }

      // update litter number
      this.cLitterIdx += 1;

      // rerender
      this.render();
    }
  };
};
