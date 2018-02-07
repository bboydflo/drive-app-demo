'use strict';

//libs
import getProp from 'get-prop';

// lodash helpers
import { map, assign, remove, concat, reduce, filter, extend, isArray, throttle,
  includes, isString, cloneDeep, capitalize, isFunction } from 'lodash';

// local vars
var log;

// exports
export default (

  // libs
  $,
  debug,
  DateFormat,
  Layout,
  Backbone,

  // modules
  Const,
  Language,
  template,
  filterFormTpl,
  errorTypes,
  SmartPigsError,

  // models
  Row,
  FormModel,
  DialogModel,
  ComplexFormModel,

  // views
  DialogView,
  FormView,
  BatchRegistrationFormView,
  TableBody,
  ComplexFormView,

  utils,
  session
) => {

  // convert to integer
  var convertToInt = function(str) { return parseInt( str, 10 ); };

  // compare dates
  var compareDates = function(dateA, dateB, type) {
    var dA = dateA.split( '-' );
    var dB = dateB.split( '-' );

    // convert each string to a number
    dA = map( dA, convertToInt );
    dB = map( dB, convertToInt );

    // compare years
    if ( dA[2] == dB[2] ) {

      // compare months
      if ( dA[1] == dB[1] ) {

        // compare days
        if ( dA[0] > dB[0] ) {

          // check type
          if ( !type ) {

            // a > b
            return 1;
          }

          // a < b
          return -1;
        }

        // compare days
        else if ( dA[0] < dB[0] ) {

          // check type
          if ( !type ) {

            // a < b
            return -1;
          }

          // a > b
          return 1;
        }

        // equal
        return 0;
      }

      // a > b
      else if ( dA[1] > dB[1] ) {

        // check type
        if ( !type ){

          // a < b
          return 1;
        }

        // a > b
        return -1;
      }

      // check type
      if ( !type ) {

        // a < b
        return -1;
      }

      // a > b
      return 1;
    }

    // a > b
    else if ( dA[2] > dB[1] ) {

      // check type
      if ( !type ) {

        // a < b
        return 1;
      }

      // a > b
      return -1;
    }

    // check type
    if ( !type ) {

      // a < b
      return -1;
    }

    // a > b
    return 1;
  };

  // sort ascending
  var sortAscending = function (a, b) { return a - b; };
  var sortDescending = function (a, b) { return b - a; };

  // sort numbers ascending and descending
  var sortNumbers = function(a, b, type) {

    // sort descending/ascending
    return type ? sortDescending( a, b ) : sortAscending( a, b );
  };

  /*
  function addZero(x,n) {
    while (x.toString().length < n) {
      x = '0' + x;
    }
    return x;
  }

  function myFunction() {
    var d = new Date();
    // var h = addZero(d.getHours(), 2);
    var m = addZero(d.getMinutes(), 2);
    var s = addZero(d.getSeconds(), 2);
    var ms = addZero(d.getMilliseconds(), 3);
    // return h + ':' + m + ':' + s + ':' + ms;
    return m + ':' + s + ':' + ms;
  }
  */

  // throttled listener
  // http://devdocs.io/lodash~4/index#throttle
  var handleTableScroll = throttle(function(e){

    // show spinner
    // $.publish( 'spinner', [true] );

    // save context
    // var _ctx = this;

    // log
    var scrollTop = this.$( e.currentTarget ).scrollTop();

    /* // development
    if ( false ) {

      // log
      console.log( 'time: ' + myFunction() + ', scrollTop = '  + scrollTop );
    } */

    // previous scrolling position
    this.sTop1 = this.sTop2;

    // current scrolling position
    this.sTop2 = scrollTop;

    // positive -> scrolling down
    // negative -> scrolling up
    // 0        -> no scrolling
    this.threshold = this.sTop1 - this.sTop2;

    /*// check direction
    if ( !this.threshold || Math.abs(this.threshold) < Const.ROW_HEIGHT ) {

      // log
      // console.log( 'little or no threshold - ' + threshold + '! do not handle scroll handler!' );

      // resume
      return;
    }

    // delay
    setTimeout(function(){

      // handle table scroll
      _ctx.handleTableScroll();
    }, 1);*/
  }, Const.TIMER_THRESHOLD, {'trailing': true});

  // reqular expressions matchers
  var reA = /[^a-zA-Z]/g;
  var reN = /[^0-9]/g;

  // sort alphanumeric helper
  // http://stackoverflow.com/questions/4340227/sort-mixed-alpha-numeric-array
  var sortAlphaNum = function (a, b, type) {
    var aA, bA, aN, bN;
    aA = a.replace(reA, '');
    bA = b.replace(reA, '');
    if(aA === bA) {
      aN = parseInt(a.replace(reN, ''), 10);
      bN = parseInt(b.replace(reN, ''), 10);

      // check type
      if ( !type ) {
        return aN === bN ? 0 : aN > bN ? 1 : -1;
      }
      return aN === bN ? 0 : aN < bN ? 1 : -1;
    } else {

      // check type
      if ( !type ) {
        return aA > bA ? 1 : -1;
      }
      return aA < bA ? 1 : -1;
    }
  };

  // return table view
  return class V extends Layout {

    constructor(options) {
      super(options);

      // extra events
      this.extraEvents = null;

      // should enable header tooltips
      this.tooltips = false;

      // view template
      this.template = template; // Templates.hbs['scrolling-table'];
    }

    /**
     * initialization code/setup
     */
    initialize() {

      // init log
      log = debug( 'Table' );

      // previous scrolling position
      this.sTop1 = 0;

      // current scrolling position
      this.sTop2 = 0;

      // positive -> scrolling down
      // negative -> scrolling up
      // 0        -> no scrolling
      this.direction = this.sTop2 - this.sTop1;

      // initialize viewport height
      this.viewportHeight = 0;
    }

    beforeRender() {

      // table body component
      if ( !this.getView('.sm-table-body') ) {

        // set card view
        this.setView( '.sm-table-body', new TableBody({
          model: this.model,
          lang: this.lang
        }) );
      }
    }

    /**
     * renders table view
     * @return {Backbone.View} - backbone table view
     */
    serialize() {
      var tModel,
        hbsObj       = {},
        hasRemovable = 0,
        tWidth       = 0;

      // get table model
      tModel = this.model.toJSON();

      // get table details
      var tHead = cloneDeep( tModel.tHead );
      var tRows = tModel.tRows;
      var props = tModel.properties;
      var rSpan = tHead.length;

      // get toggle all state
      var toggleAll = this.model.get( 'toggleAll' );

      // default toggle input
      var toggleInput = '<input type="checkbox" class="check-all tooltip-target" aria-label="check all" title="check all" ';

      // check toggle all state
      if ( toggleAll ) {

        // all rows selected.
        toggleInput += 'checked ';
      }

      // update toggle input
      toggleInput += '>';

      // check if there is at least one removable row
      for( var i=0; i<tRows.length; i++ ) {

        // check if removable
        if( tRows[i].removable ) {

          // update flag
          hasRemovable = 1;

          // skip the loop
          break;
        }
      }

      // calculate header length
      var tHeadLength = 0;

      // map through header rows to update them accordingly
      tHead = map(tHead, function(hRow, idx) {

        // check if it has heading array
        if ( !getProp(hRow, ['th', 'length'], false) ) return hRow;

        // increment header length
        tHeadLength++;

        // filter invisible table headings (id and dirty)
        hRow.th = filter(hRow.th, function(tHeading){ return tHeading.bVisible; });

        // has removable rows
        if ( hasRemovable ) {

          // insert fake column
          hRow.th.push({
            iSpan: 1,
            iWidth: 40,
            sClass: '',
            sTitle: ''
          });
        }

        // map through each header column and update tooltip
        // also update first column if that's a checkmark column
        map(hRow.th, function(tHeading){

          // check if has any title
          if ( tHeading.sTitle ) {

            // update tooltip title
            tHeading.ttTitle = tHeading.sTitle;
          }

          // last header row + select column
          if ( idx == rSpan-1 && tHeading.iClick == -1 ) {

            // update column class
            tHeading.sClass = 'checkmark';

            // update header title
            tHeading.sTitle = toggleInput;

            // resume
            return tHeading;
          }

          // check sTitle
          if ( tHeading.sTitle ) {

            // update sTitle
            tHeading.sTitle = '<span class="limited-thead-cell">' +
                              '<span class="tooltip-target ' + tHeading.sClass +
                              '" style="position: absolute;" title="' + (tHeading.ttTitle || '') +
                              '">' + tHeading.sTitle +
                              '</span></span>';
          }

          // resume
          return tHeading;
        });

        // resume
        return hRow;
      });

      // get total width
      tWidth += reduce( tHead[props.lastHeaderIdx].th, function( sum, value ) {

        // reducer
        return sum + value.iWidth;
      }, tWidth);

      // update table model
      this.model.set( 'tWidth', tWidth );

      // check if any rows
      if ( tRows.length ) {

        // setup viewport
        this.setupViewport( tHeadLength, tRows.length );

        // check scroll top
        if ( tModel.scrollTop ) {

          // update scroll
          this.updateScroll( false );
        } else {

          // setup scroll
          this.setupScroll( tRows );
        }
      }

      // update handlebars object
      hbsObj.tHead        = tHead;
      hbsObj.tWidth       = tWidth;
      hbsObj.fullWidth    = tWidth + 20;
      hbsObj.hasScroll    = this.model.get( 'hasScroll' );
      hbsObj.scrollHeight = this.model.get( 'scrollHeight' );

      // serialized table view
      return hbsObj;
    }

    afterRender() {

      // save context
      // var _ctx = this;

      // apply scroll
      this.$( '.sm-table-body' ).scrollTop( this.sTop2 );

      // attach scroll handler
      this.$( '.sm-table-body' ).scroll( handleTableScroll.bind(this) );

      /*// attach scroll handler
      this.$( '.sm-table-body' ).scroll(function(e){

        // log
        console.log( 'first scroll' );

        // handleTableScroll.bind(this)
        handleTableScroll.call( _ctx, e );
      });*/

      /*this.$( '.sm-table-body' ).scroll(debounce(function(e){

        // handle table scroll
        handleTableScroll.call( _ctx, e );

        // show spinner
        $.publish( 'spinner', [true] );
      }, 150, { 'leading': true, 'trailing': false }));*/

      /*this.$( '.sm-table-body' ).scroll(debounce(function(){

        // log
        console.log( 'second scroll' );

        // hide spinner
        $.publish( 'spinner', [false] );

        // log
        // $.publish( 'toast', [2, 'SCROLLING STOPPED!'] );
      }, Const.TIMER_THRESHOLD ));*/

      // check if any extra handlers
      if ( !this.extraEvents ) {

        // log
        log( 'no extra events' );

        // resume
        return;
      }

      // log
      log( 'reattach extra events for ' + this.model.get('tId') );

      // reattach handlers
      this.delegateEvents( this.extraEvents );

      // should enable tooltipster plugin
      if ( this.tooltips ) {

        // apply tooltip plugin
        this.$( '.tooltip-target' ).tooltipster({ multiple: true });
      }
    }

    changeOrientation() {

      // save context
      var _ctx = this;

      // delay
      setTimeout(function(){

        // reset viewport height
        _ctx.viewportHeight = 0;

        // setup viewport
        _ctx.setupViewport();

        // update scroll
        _ctx.updateScroll( true );

        // refresh table
        _ctx
          .render()
          .promise()
          .done(function(){

            // get body
            var tBody = _ctx.getView( '.sm-table-body' );

            // refresh table body
            tBody.render();
          });
      }, 500);
    }

    resetScroll() {

      // reset viewport
      this.viewportHeight = 0;

      // setup viewport
      this.setupViewport();

      // update scroll
      this.updateScroll( true );
    }

    /**
     * calculate hasScroll, scrollHeight and update the model
     */
    setupViewport(headerLength, rowsLength) {
      var e, g, y, hasScroll, scrollHeight,
        tModel = this.model.toJSON();

      // update variables
      headerLength = headerLength || tModel.tHead.length;
      rowsLength   = rowsLength || 0;

      // viewport not calculated
      if (!this.viewportHeight) {

        // get viewport width and height
        e = document.documentElement;
        g = document.getElementsByTagName('body')[0];
        y = window.innerHeight|| e.clientHeight|| g.clientHeight;

        // calculate viewport height
        this.viewportHeight = y - (Const.NAV_HEIGHT + Const.PANEL_TITLE__HEIGHT + headerLength * Const.ROW_HEIGHT + Const.PANEL_FOOTER_HEIGHT + Const.SCROLLBAR_HEIGHT );

        // adjust scroll height
        this.viewportHeight = this.viewportHeight - this.viewportHeight % Const.ROW_HEIGHT;
      }

      // check if any rows
      if ( !rowsLength ) return;

      // update has scroll state
      hasScroll = rowsLength * Const.ROW_HEIGHT > this.viewportHeight;

      // update scroll height measurement unit
      scrollHeight = hasScroll ? this.viewportHeight + 'px' : '100%';

      // update model
      this.model.set({
        hasScroll: hasScroll,
        scrollHeight: scrollHeight
      });
    }

    setupScroll(tRows) {

      /*// compute maximum number of viewport rows
      var maxViewportRows = Math.floor( this.viewportHeight / Const.ROW_HEIGHT );

      // compute visible rows
      var visibleRows = tRows.length < maxViewportRows ? tRows.length : maxViewportRows;

      // compute bottom rows
      var bottomRows = tRows.length - visibleRows;

      // compute bottom index. zero indexed
      var bIndex = visibleRows + ( bottomRows < Const.HIDDEN_ROWS ? bottomRows : Const.HIDDEN_ROWS );*/
      var bIndex = tRows.length;

      // compute bottom fake row height
      // var rowAfterHeight = (tRows.length - bIndex) * Const.ROW_HEIGHT;
      var rowAfterHeight = 0;

      // update model
      this.model.set({
        bIndex: bIndex,
        rowAfterHeight: rowAfterHeight
      });
    }

    handleTableScroll() {

      // get table body
      var tableBody = this.getView( '.sm-table-body' );

      // should update
      var shouldUpdate = this.updateScroll( true );

      // get scroll setup
      if ( shouldUpdate ) {

        // refresh table body
        tableBody.render();
      }
    }

    updateScroll(iScroll) {

      // table model
      var tModel = this.model.toJSON();

      // get scroll threshold
      var scrollThreshold = tModel.scrollTop - this.sTop2;

      // check scroll threshold
      if ( !scrollThreshold && iScroll ) return;

      // check iScroll
      if ( !iScroll ) return false;

      // get absolute threshold
      var absThreshold = Math.abs( scrollThreshold );

      // compute threshold rows
      var thresholdRows = ( absThreshold - absThreshold % Const.ROW_HEIGHT ) / Const.ROW_HEIGHT;

      // rows from the top
      var topRows = ( this.sTop2 - this.sTop2 % Const.ROW_HEIGHT ) / Const.ROW_HEIGHT;

      // get number of viewport rows
      var maxViewportRows = Math.floor( this.viewportHeight / Const.ROW_HEIGHT );

      // compute maximum index length
      var maxIndexLength = maxViewportRows + 2 * Const.HIDDEN_ROWS;

      // log
      // console.log( 'threshold rows: ' + thresholdRows + ', rows from the top ' + topRows );

      // define vars
      var tIndex = tModel.tIndex;
      var bIndex = tModel.bIndex;

      // row before height and row after height
      var rowAfterHeight  = tModel.rowAfterHeight;
      var rowBeforeHeight = tModel.rowBeforeHeight;

      // if ( thresholdRows < Const.HIDDEN_ROWS ) return;
      if ( thresholdRows < Const.SCROLL_DOWN ) {

        // scroll down
        if ( scrollThreshold < 0 ) {

          // check top rows
          if ( topRows < Const.HIDDEN_ROWS ) {

            // adjust top index
            tIndex = 0;

            // update row before height
            rowBeforeHeight = 0;
          } else {

            // compute top index
            tIndex = topRows - Const.HIDDEN_ROWS;

            // update row before height
            rowBeforeHeight = tIndex * Const.ROW_HEIGHT;
          }

          // compute bottom index
          bIndex = tIndex + maxIndexLength;

          // check bottom index
          if ( bIndex >= tModel.tRows.length ) {

            // adjust bottom index
            bIndex = tModel.tRows.length;

            // top index
            tIndex = bIndex - maxViewportRows - Const.HIDDEN_ROWS;
          }
        } else {

          // update bottom index and top index
          bIndex = tModel.bIndex - thresholdRows;
          tIndex = bIndex - maxIndexLength - 1;

          // check top index
          if ( tIndex < Const.HIDDEN_ROWS ) {

            // update top index
            tIndex = 0;

            // update row before height
            rowBeforeHeight = 0;

            // compute bottom index
            bIndex = maxViewportRows + Const.HIDDEN_ROWS;
          } else {

            // compute row before height
            rowBeforeHeight = ( tIndex - Const.HIDDEN_ROWS ) * Const.ROW_HEIGHT;
          }
        }

        /*// log
        console.log( 'adjust silently', {
          tIndex: tIndex,
          bIndex: bIndex,
          rowBeforeHeight: rowBeforeHeight,
          rowAfterHeight: rowAfterHeight
        });*/

        // update fake rows height
        this.model.set({
          tIndex: tIndex,
          bIndex: bIndex,
          rowBeforeHeight: rowBeforeHeight,
          rowAfterHeight: rowAfterHeight
        });

        // resume
        return false;
      }

      // scroll down
      if ( scrollThreshold < 0 ) {

        // check top rows
        if ( topRows < Const.HIDDEN_ROWS ) {

          // adjust top index
          tIndex = 0;
        } else {

          // compute top index
          tIndex = topRows - Const.HIDDEN_ROWS;

          // adjust top index
          if ( tModel.tIndex === 0 ) {

            // adjust top index
            tIndex = topRows - Const.HIDDEN_ROWS;
          }
        }

        // update row before height
        rowBeforeHeight = tIndex * Const.ROW_HEIGHT;

        // compute bottom index
        bIndex = tIndex + maxIndexLength;

        // check bottom index
        if ( bIndex >= tModel.tRows.length ) {

          // adjust bottom index
          bIndex = tModel.tRows.length;

          // top index
          tIndex = bIndex - maxViewportRows - Const.HIDDEN_ROWS;
        }
      } else {

        // check top rows
        if ( topRows < Const.HIDDEN_ROWS ) {

          // adjust top index
          tIndex = 0;
        } else {

          // compute top index
          tIndex = topRows - Const.HIDDEN_ROWS;
        }

        // update row before height
        rowBeforeHeight = tIndex * Const.ROW_HEIGHT;

        // compute bottom index
        bIndex = tIndex + maxIndexLength;
      }

      // compute row after height
      rowAfterHeight = ( tModel.tRows.length - bIndex ) * Const.ROW_HEIGHT;

      /*console.dir({
        scrollTop: this.sTop2,
        rowBeforeHeight: rowBeforeHeight,
        tIndex: tIndex,
        bIndex: bIndex,
        rowAfterHeight: rowAfterHeight
      });*/

      // update model
      this.model.set({
        scrollTop: this.sTop2,
        rowBeforeHeight: rowBeforeHeight,
        tIndex: tIndex,
        bIndex: bIndex,
        rowAfterHeight: rowAfterHeight
      });

      // resume
      return true;
    }

    // toggle tooltips
    toggleTooltips() {

      // update tooltips
      this.tooltips = !this.tooltips;
    }

    // set extra handlers. this extra handlers will be reattached
    // each time the view will rerender
    setEventHandlers(handlers) {

      // validate handlers variable
      if ( !handlers || !$.isPlainObject(handlers)  || $.isEmptyObject(handlers) ) return;

      // validate handlers callbacks
      for ( var cb in handlers ) {

        // check idf cb is a function
        if ( !isFunction(handlers[cb]) ) return;
      }

      // update extra handlers
      this.extraEvents = handlers;
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    sortColumnByIndex(opt) {
      var sortType = false,
        isSorted   = false;

      // get rows
      var tRows = this.model.get( 'tRows' );

      // check sort index
      if ( this.model.get('sortIndex') == opt.cIndex ) {

        // update sort type
        sortType = !this.model.get( 'sortType' );
      }

      // update sort index
      this.model.set( 'sortIndex', opt.cIndex );

      // sorty by
      switch ( opt.iClick ){
      case 1:
      case 4:
      case 5:
      case 7:

        // sort by value
        tRows.sort(function (a, b) {

          // sort response
          return sortNumbers( a.data[opt.cIndex], b.data[opt.cIndex], sortType );
        });

        // update is sorted
        isSorted = true;
        break;
      case  2:
      case  6:
      case 10:
      case 13:

        // sort by value
        tRows.sort(function (a, b) {
          var nameA = a.data[opt.cIndex].toUpperCase(); // ignore upper and lowercase
          var nameB = b.data[opt.cIndex].toUpperCase(); // ignore upper and lowercase

          // resume
          return sortAlphaNum( nameA, nameB, sortType );
        });

        // update is sorted
        isSorted = true;
        break;
      case 3:

        // filter empty rows
        var emptyRows = filter(tRows, function(row){

          // filter criteria
          return !row.data[opt.cIndex];
        });

        // check if any empty rows
        if ( emptyRows.length ) {

          // get non empty rows
          var nonEmptyRows = filter(tRows, function(row){

            // filter criteria
            return row.data[opt.cIndex];
          });

          // sort by value
          nonEmptyRows.sort(function(a, b) {

            // resume
            return compareDates( a.data[opt.cIndex], b.data[opt.cIndex], sortType );
          });

          // update rows
          if ( !sortType ) {

            // redefine tRows
            tRows = concat( emptyRows, nonEmptyRows );
          } else {

            // redefine tRows
            tRows = concat( nonEmptyRows, emptyRows );
          }
        } else {

          // log
          log( emptyRows.length + ' empty rows' );

          // sort by value
          tRows.sort(function(a, b) {

            // resume
            return compareDates( a.data[opt.cIndex], b.data[opt.cIndex], sortType );
          });
        }

        // update is sorted
        isSorted = true;
        break;
      default:

        // log
        log( 'sorting not implemented yet...' );
        break;
      }

      // is sorted
      if ( isSorted ) {

        // update sort type
        this.model.set( 'sortType', sortType );

        // update rows
        this.model.set( 'tRows', tRows );

        // success
        return true;
      }

      // error
      return false;
    }

    /**
     * check row by attribute and value
     * @param  {String} attr - get row by attribute
     * @param  {Object} value - value
     * @param  {boolean} checked - extra parameter used in setter mode
     * @return {[type]}         [description]
     */
    toggleCheckRowBy(attr, value, tRow) {

      // get table row
      tRow = tRow || this.getRowsBy( attr, value, true );

      // check row
      if ( !tRow ) {

        // toast
        $.publish( 'toast', [2, 'SmartPigs Error: table row with ' + attr + '= ' + value + ', could not be found @toggleCheckRowBy()!'] );

        // resume
        return;
      }

      // toggle checkmark
      tRow.toggleCheck();

      // return updated row
      return this.updateRowBy( attr, value, tRow );
    }

    toggleAll(toggleState) {

      // get rows
      var tRows = this.model.get( 'tRows' );

      // resume early
      if ( !tRows.length ) return;

      // update checked state for all currently visible rows
      map(tRows, function( row ){

        // check only visible rows
        if ( row.selected ) {

          // toggle row checked state
          // will true to 0 and false to 1;
          // update checked column (cIndex = 0)
          // row.checked = 1 - ( toggleState | 0 );
          row.data[0] = 1 - ( toggleState | 0 );
        }
      });

      // update model
      this.model.set({ tRows: tRows, toggleAll: !toggleState });

      // resume
      return true;
    }

    /**
     * get number of rows in the header
     * @return {int}
     */
    getHeaderLength() {

      // get table head
      var tHead = this.model.get( 'tHead' );

      // resume
      return tHead.length;
    }

    /**
     * get header by index. if no index passed or negative index return last header
     * @param  {number} hIndex - header index to be retrieved
     * @return {array} return corresponding header
     */
    getHeader(hIndex) {
      var tHead = this.model.get( 'tHead' );

      // check if last header is a number
      if ( typeof hIndex == 'undefined' || hIndex < 0 ) {

        // update header index
        hIndex = tHead.length-1;
      }

      // return appropriate header
      return getProp( tHead[hIndex], ['th'], [] );
    }

    // get first header
    getFirstHeader() {

      // return first header
      return this.getHeader( 0 );
    }

    // get last header
    getLastHeader() {

      // return last header
      return this.getHeader();
    }

    /**
     * [get column properties by column index]
     * @param  {number} cIndex - column index number
     * @return {object} - object representing specific column index properties
     */
    getColumnProperties(cIndex) {

      // get table model
      var tModel = this.model.toJSON();

      // get column properties
      return tModel.tHead[tModel.properties.lastHeaderIdx].th[cIndex];
    }

    getColumnProperty(cIndex, prop) {

      // get column properties
      var colProps = this.getColumnProperties( cIndex );

      // return property or false
      return getProp( colProps, [prop], false );
    }

    /**
     * find column index by attribute and value
     * @param  {String} attr - query string
     * @param  {String|Number|boolean} value - value that should match
     * @return {Number} - returns the index of column or false if nothing has been found
     */
    findColumnBy(attr, value) {

      // simple validation
      if ( typeof value == 'undefined' || typeof attr !== 'string' ) return false;

      // get table model
      var tModel = this.model.toJSON();

      // loop through last column header
      for( var i=0; i<tModel.properties.lastHeaderLength; i++ ) {

        // check if column found
        if ( value == this.getColumnProperty( i, attr ) ) {

          // break loop. returns first index found
          return i;
        }
      }

      // resume
      return false;
    }

    /**
     * checks if passed row index is valid
     * @param  {[number|string]} rIndex [row index]
     * @return {[boolean]} returns true|false
     */
    validateRow(rIndex) {

      // converts row index to a valid integer
      if ( !utils.isInt(rIndex) || rIndex<0 ) return false;

      // get table rows
      var tRows = this.model.get( 'tRows' );

      // check if valid array
      if ( !tRows || !isArray(tRows) || !tRows.length ) return false;

      // validate row
      if ( rIndex >= tRows.length ) return false;

      // resume (if got here, then row index is valid)
      return true;
    }

    /**
     * TODO
     *
     * =>
     */
    validateColumn(cIndex) {

      // resume
      return cIndex;
    }

    /**
     * gets dirty value for specific row
     * @param  {number|string} rIndex - row index
     * @return {number} - returns dirty value for the specific row, or false
     * if operation fails
     * REVIEW
     */
    getDirty(rIndex) {

      // get table model
      var tModel = this.model.toJSON();

      // get table extra flag
      var tExtra = this.model.get( 'tExtra' );

      // check if options extra
      if ( tExtra ) {

        // get dirty
        var dirty = this.getValue( rIndex, tModel.properties.lastHeaderLength-1 );

        // check dirty
        dirty = utils.isInt(dirty) ? dirty : false;

        // return
        return dirty;
      }
    }

    /**
     * sets dirty value on specific row identified by row index
     * @param {number|string} rIndex - row index
     * @param {number|string} dirty - new dirty value
     * @return {number|false} - returns new dirty or false, if operation fails
     * Examples:
     *   + set dirty 0 on row 2
     *     tView.setDirty( 2, 0 );
     *   + set dirty on row 1
     *     tView.setDirty( 2, 7 );
     *   + update dirty on row 2
     *     tView.setDirty( 2 );
     */
    setDirty(rIndex, dirty) {
      var i, dataVal,
        tModel = this.model.toJSON();

      // validate row index -> resume early
      if ( !this.validateRow(rIndex) || !tModel.tExtra ) return;

      // validate dirty
      if ( utils.isInt(dirty) ) {

        // check if should clear dirty
        if ( dirty === 0 ) {

          // clear dirty property
          tModel.tDirty = false;

          // clear isDirty property on specific row
          tModel.tRows[ rIndex ].isDirty = 0;

          // mark row as not hidden
          tModel.tRows[ rIndex ].hidden = 0;
        } else {

          // update options dirty property
          tModel.tDirty = true;

          // update isDirty property on specific row
          tModel.tRows[ rIndex ].isDirty = 1;

          // check if marked as deleted
          if ( dirty == Math.pow(2, tModel.properties.lastHeaderLength) ) {

            // get current dirty and save it
            tModel.tRows[ rIndex ].restoreDirty = this.getDirty( rIndex );

            // mark row as hidden
            tModel.tRows[ rIndex ].hidden = 1;
          }
        }
      } else {

        // calculate dirty based on row data. reset dirty
        dirty = 0;

        // loop through each column and calculate dirty
        for ( i=0; i<tModel.tRows[rIndex].data.length-2; i++ ) {

          // get data value
          dataVal = tModel.tRows[ rIndex ].data[ i ];

          // check data type
          switch ( typeof dataVal ) {
          case 'string':
            if ( dataVal ) {

              // update dirty
              dirty |= Math.pow( 2, i );
            }
            break;
          case 'number':

            // update dirty
            dirty |= Math.pow( 2, i );
            break;
          default:
            break;
          }
        }

        // update isDirty property on specific row
        tModel.tRows[ rIndex ].isDirty = 1;

        // mark row as not hidden
        tModel.tRows[ rIndex ].hidden = 0;

        // update dirty
        tModel.tDirty = true;
      }

      // update model
      this.model.set( tModel );

      // set dirty
      return this.setValue( rIndex, tModel.properties.lastHeaderLength-1, dirty );
    }

    /**
     * normalize row common method
     * @param  {[type]} row [description]
     * @param  {[type]} idx [description]
     * @return {[type]}     [description]
     */
    normalizeRow(row, idx) {

      // get id
      var id = row.data[ row.data.length - 2 ];

      // create new table row
      var tRow = new Row( assign(row, { id: id, rIndex: idx }) );

      // return serialized row;
      return tRow.toJSON();
    }

    /**
     * update dirty on the given table row
     * @param  {object} tRow - given table row
     * @param  {number} dirty - new dirty value
     * @return {number|false} - returns new dirty value or false
     */
    updateDirtyRow(tRow, dirty) {

      // get data length
      var dLength = tRow.data.length;

      // validate dirty
      if ( utils.isInt(dirty) ) {

        // update isDirty flag
        tRow.isDirty = 1;

        // should clear dirty
        if ( dirty === 0 ) {

          // clear isDirty flag
          tRow.isDirty = 0;

          // clear hidden flag
          tRow.hidden = 0;
        }

        // prepare row to be deleted
        if ( dirty < 0 ) {

          // set row hidden flag to true
          tRow.hidden = 1;

          // update dirty
          dirty = Math.pow( 2, dLength );
        }
      } else {

        // reset dirty
        dirty = 0;

        // loop through each column and update dirty
        /*for ( i=0; i<dLength-2; i++ ) {

          // get data value
          dataVal = row.data[i];

          // check data type
          switch ( typeof dataVal ) {
            case 'string':
              if ( dataVal ) {

                // update dirty
                dirty |= Math.pow( 2, i );
              }
            break;
            case 'number':

              // update dirty
              dirty |= Math.pow( 2, i );
            break;
            default: break;
          }
        }*/

        // use reduce to get final dirty value
        dirty = reduce(tRow.data, function(dirty, value, index) {

          // local dirty
          var d = 0;

          // check data type
          switch ( typeof value ) {
          case 'string':
            if ( value ) {

              // update local dirty
              d = Math.pow( 2, index );
            }
            break;
          case 'number':

            // update local dirty
            d = Math.pow( 2, index );
            break;
          default:
            break;
          }

          // reducer
          return dirty | d;
        }, 0);

        // toast
        $.publish( 'toast', [1, 'dirty = ' + dirty] );

        // update isDirty property on specific row
        tRow.isDirty = 1;
      }

      // update dirty row
      tRow.data[dLength-1] = dirty;

      // resume
      return dirty;
    }

    /**
     * update row with new id
     * @param  {object} tRow - given table row
     * @param  {string|number} newId - new id
     * @return {object|boolean} - return updated row or false if operation fails
     */
    updateRowId(tRow, newId) {

      // local vars
      var dLength = tRow.data.length;

      // get id column index
      var cIndex = dLength - 2;

      // update 'id' directly on the row object
      tRow.id = newId;

      // update value
      if ( this.setRowValue(tRow, cIndex, newId) ){

        // resume success
        return tRow;
      }

      // resume error
      return false;
    }

    /**
     * set value into a row, using column index
     * @param {object} tRow - given table row
     * @param {number} cIndex - giben column index
     * @param {string|number|boolean} value - new value
     * @param {boolean} setDirty - should update dirty or not
     */
    setRowValue(tRow, cIndex, value, setDirty) {

      // get data length
      var dLength = tRow.data.length;

      // validate column index
      if ( cIndex >= dLength ) {

        // toast
        $.publish( 'toast', [2, 'SmartPigs Error: invalid column index @setRowValue()!'] );

        // resume
        return false;
      }

      // update value
      tRow.data[ cIndex ] = value;

      // should update dirty
      if ( setDirty ) {

        // calculate dirty
        var dirty = Math.pow( 2, cIndex );

        // update dirty
        if ( dirty == this.updateDirtyRow(tRow, dirty) ) {

          // resume success
          return tRow;
        }
      }

      // resume success
      return tRow;
    }

    /**
     * sets dirty value on specific row identified by row id
     * @param {number|string} rowId - row id
     * @param {number|string} dirty - new dirty value
     * @return {row|false} - returns dirty row or false, if operation fails
     * Examples:
     *   + mark row wirh id 6 as deleted
     *     tView.setDirtyById( 6, -1 );
     *   + clear dirty on row with id = 2
     *     tView.setDirtyById( 2, 0 );
     *   + set dirty on row with id = 1
     *     tView.setDirtyById( 2, 7 );
     *   + update dirty on row with id = 2
     *     tView.setDirtyById( 2 );
     */
    setDirtyById(rowId, dirty) {
      var tRow = this.getRowsBy( 'id', rowId, true );

      // check row
      if ( !tRow ) {

        // toast
        $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + rowId + ', could not be found @setDirtyById()!'] );

        // resume
        return false;
      }

      // get data length
      var dLength = tRow.data.length;

      // validate dirty
      if ( utils.isInt(dirty) ) {

        // update isDirty flag
        tRow.isDirty = 1;

        // should clear dirty
        if ( dirty===0 ) {

          // clear isDirty flag
          tRow.isDirty = 0;
        }

        // prepare row to be deleted
        if ( dirty < 0 ) {

          // set row hidden flag to true
          tRow.hidden = 1;

          // update dirty
          dirty = Math.pow( 2, dLength );
        }
      } else {

        // reset dirty
        dirty = 0;

        // use reduce to get final dirty value
        dirty = reduce(tRow.data, function(dirty, value, index) {

          // local dirty
          var d = 0;

          // check data type
          switch ( typeof value ) {
          case 'string':
            if ( value ) {

              // update local dirty
              d = Math.pow( 2, index );
            }
            break;
          case 'number':

            // update local dirty
            d = Math.pow( 2, index );
            break;
          default: break;
          }

          // reducer
          return dirty | d;
        }, 0);

        // toast
        $.publish( 'toast', [1, 'dirty = ' + dirty] );

        // update isDirty property on specific row
        tRow.isDirty = 1;
      }

      // update dirty
      tRow.data[dLength-1] = dirty;

      // return updated row
      return this.updateRowBy( 'id', rowId, tRow );
    }

    /**
     * will clear dirty on specific row
     * @param  {number|string} rIndex - row index represented as an integer or
     * string that represents an integer
     * @return {number|false} - returns 0 or false if operation fails
     */
    clearDirty(rIndex) {

      // set dirty on row index
      return this.setDirty( rIndex, 0 );
    }

    /**
     * gets id for specific row
     * @param  {number|string} rIndex - row index
     * @return {number|false} - returns id for the specific row, or false
     * if operation fails
     */
    getId(rIndex) {

      // get table properties
      var properties = this.model.get( 'properties' );

      // return id
      return this.getValue( rIndex, properties.lastHeaderLength-2 );
    }

    /**
     * helper method that sets an id on specific row
     * @param {number|string} rIndex - row index
     * @param {number|string} dirty - new id value
     * @return {number|false} - returns new id or false, if operation fails
     * Examples:
     *   + set id 123131231 on row 2
     *     tView.setId( 2, 123131231 );
     *   + set id on row 1
     *     tView.setId( 1, '3413131412' );
     */
    setId(rIndex, newId){

      // get table properties
      var properties = this.model.get( 'properties' );

      // set table id
      return this.setValue( rIndex, properties.lastHeaderLength-2, newId );
    }

    /**
     * get value from row data
     * @param  {number|string} rIndex - row index
     * @param  {number|string} cIndex - column index
     * @return {number|string|boolean} - returns coresponding value from row
     * rIndex and column cIndex or false if operation fails.
     * REVIEW
     */
    getValue(rIndex, cIndex) {

      // get table model
      var tModel = this.model.toJSON();

      // check if valid row index
      if ( this.validateRow(rIndex) ) {

        // get row length
        var rowLength = tModel.tRows[ rIndex ].data.length;

        // extra check
        if ( rowLength && cIndex<rowLength ) {

          // get value
          return tModel.tRows[ rIndex ].data[ cIndex ];
        }
      }

      // resume
      return false;
    }

    /**
     * will set a value in row
     * @param {number|string} rIndex - row index
     * @param {number|string} cIndex - column index
     * @param {number|string|boolean} newValue - new value
     * @param {boolean} setDirty - set dirty flag
     */
    setValue(rIndex, cIndex, newValue, setDirty) {

      // validate row index -> resume early
      if ( !this.validateRow(rIndex) ) return;

      // get table model
      var tModel = this.model.toJSON();

      // check if column index is less then or equal than table row data length
      if ( cIndex > tModel.properties.lastHeaderLength ) {

        // toast
        $.publish( 'toast', [2, 'warning: wrong column index!'] );

        // resume
        return;
      }

      // get column type
      var cType = tModel.tHead[tModel.properties.lastHeaderIdx].th[cIndex].iClick;

      // validate new value against column type
      switch ( cType ) {

      // id and dirty
      case 0:

        // update model
        tModel.tRows[rIndex].data[cIndex] = newValue;
        break;
      case 1:
      case 4:
      case 5:
      case 7:
      case 11:
      case 15:

        // check number
        if ( !isFinite(newValue) ) {

          // toast
          $.publish( 'toast', [2, 'warning: ' + newValue + ' invalid type!'] );

          // resume
          return;
        }

        // update model
        tModel.tRows[rIndex].data[cIndex] = newValue;
        break;
      case 2:
      case 3:
      case 6:
      case 10:

        // check string
        if ( !isString(newValue) ){

          // toast
          $.publish( 'toast', [2, 'warning: ' + newValue + ' invalid type!'] );

          // resume
          // return false;
          return;
        }

        // extra validation in case it's type 3 and we know how the user
        // is handling/formatting dates
        if ( cType==3 ) {

          // log
          log( 'Table.setValue() -> [Date] extra validation' );
        }

        // update model
        tModel.tRows[rIndex].data[cIndex] = newValue;
        break;
      default:
        break;
      }

      // check set dirty flag
      if ( setDirty ) {

        // get current dirty
        var cDirty = this.getDirty( rIndex );

        // update current dirty
        cDirty |= Math.pow( 2, cIndex );

        // update model dirty
        this.setDirty( rIndex, cDirty );
      }

      // update model
      this.model.set( tModel );

      // resume
      return newValue;
    }

    /**
     * set value on row defined by id
     * @param {number|string} rowId - row id
     * @param {number} cIndex - column index
     * @param {number|string|boolean} newValue - new value
     * @param {boolean} setDirty - defines if dirty should be also updated
     * returns newValue or false if operation fails
     */
    setValueById(rowId, cIndex, newValue, setDirty) {

      // validate row id
      if ( isNaN(rowId) || rowId < 0 ) {

        // toast
        $.publish( 'toast', [2, 'SmartPigs Error: invalid row id @setValueById()'] );

        // resume
        return false;
      }

      // get row by id
      var tRow = this.getRowsBy( 'id', rowId, true );

      // validate row
      if ( !tRow ) {

        // toast
        $.publish( 'toast', [2, 'Could not find row by id = ' + rowId] );

        // resume fail
        return false;
      }

      // get column type
      var iClick = this.getColumnProperty( cIndex, 'iClick' );

      // validate new value against column type
      switch ( iClick ) {

      // id and dirty
      case 0:
        break;
      case 1:
      case 4:
      case 5:
      case 7:
      case 11:

        // check number
        if ( !isFinite(newValue) ) {

          // toast
          $.publish( 'toast', [2, 'warning: ' + newValue + ' invalid type!'] );

          // resume
          return false;
        }
        break;
      case 2:
      case 3:
      case 6:
      case 10:

        // check string
        if ( !isString(newValue) ){

          // toast
          $.publish( 'toast', [2, 'warning: ' + newValue + ' invalid type!'] );

          // resume
          return false;
        }

        // extra validation in case it's type 3 and we know how the user
        // is handling/formatting dates
        if ( iClick == 3 ) {

          // log
          log( 'Table.setValue() -> [Date] extra validation' );
        }
        break;
      default:
        break;
      }

      // update model
      tRow.setValue( cIndex, newValue, setDirty );

      // return updated row
      return tRow;
    }

    /**
     * update row with attr and value
     * @param {String} attr - query attribute
     * @param {Object} value - query value
     * @param {Number} cIndex - column index
     * @param {Object} newValue - new column value
     * @param {boolean} setDirty - boolean value to set dirty or no
     */
    setValueBy(attr, value, cIndex, newValue, setDirty) {

      // validate row id
      if ( typeof attr !== 'string' || !attr.length ) {

        // toast
        $.publish( 'toast', [2, 'SmartPigs Error: invalid attribute @setValueBy()'] );

        // resume
        return false;
      }

      // get row by id
      var tRow = this.getRowsBy( attr, value, true );

      // validate row
      if ( !tRow ) {

        // toast
        $.publish( 'toast', [2, 'Could not find row by ' + attr + '= ' + value] );

        // resume fail
        return false;
      }

      // get column type
      var iClick = this.getColumnProperty( cIndex, 'iClick' );

      // validate new value against column type
      switch ( iClick ) {

      // id and dirty
      case 0:
        break;
      case 1:
      case 4:
      case 5:
      case 7:
      case 11:

        // check number
        if ( !isFinite(newValue) ) {

          // toast
          $.publish( 'toast', [2, 'warning: ' + newValue + ' invalid type!'] );

          // resume
          return false;
        }
        break;
      case 2:
      case 3:
      case 6:
      case 10:

        // check string
        if ( !isString(newValue) ){

          // toast
          $.publish( 'toast', [2, 'warning: ' + newValue + ' invalid type!'] );

          // resume
          return false;
        }

        // extra validation in case it's type 3 and we know how the user
        // is handling/formatting dates
        if ( iClick == 3 ) {

          // log
          log( 'Table.setValue() -> [Date] extra validation' );
        }
        break;
      default:
        break;
      }

      // update model
      tRow.setValue( cIndex, newValue, setDirty );

      // return updated row
      return tRow;
    }

    /**
     * get row by attribute
     * @param  {string} attr - attribute to check for
     * @param  {string|number|boolean} value - value to check for
     * @param  {boolean} first - should return first element only. or return all  found elements
     * @return {array|boolean} - returns array of rows or false if nothing found
     */
    getRowsBy(attr, value, first) {

      // check attr
      if ( attr == 'id' && value == 'a' ) {

        // return empty row
        return this.getEmptyRow();
      }

      // get rows
      var tRows = this.model.get( 'tRows' );

      // return filtered rows
      var result = filter( tRows, function(row) {
        return row[attr] == value;
      });

      // any row found
      if ( !result.length ) return false;

      // first exists and is truthy
      if ( first ) {

        // return new row
        return new Row( result[0] );
      }

      // resume
      return result;
    }

    /**
     * get row by attribute optimized
     * @param  {array} tRows - collection of rows
     * @param  {string} attr - attribute to check for
     * @param  {string|number|boolean} value - value to check for
     * @param  {boolean} first - should return first element only. or return all  found elements
     * @return {array|boolean} - returns array of rows or false if nothing found
     */
    foundInColection(tRows, attr, value) {

      // return filtered rows
      var result = filter( tRows, function(row) {
        return row[attr] == value;
      });

      // any row found
      if ( result.length ) return result;

      // resume
      return false;
    }

    /**
     * get row data for specific index
     * @param  {number|string|boolean} rIndex - row index.
     *   if rIndex is boolean and it's true, return last row
     * @return {object|boolean} - returns object that holds row data
     * or false if operation fails
     */
    getRow(rIndex) {
      var _row = {tr:[]},
        tModel = this.model.toJSON();

      // if rIndex is true -> fetch last row
      if ( typeof rIndex == 'boolean' ) {

        // update rIndex
        rIndex = tModel.tRows.length-1;
      }

      // minimal check
      if ( this.validateRow(rIndex) ) {

        // update modified row
        _row.tr.push( tModel.tRows[rIndex] );

        // returned modified row
        return _row;
      }

      // resume
      return false;
    }

    // get row by index
    getRowByIndex(rIndex) {
      var tModel = this.model.toJSON();

      // if rIndex is true -> fetch last row
      if ( typeof rIndex == 'boolean' && rIndex ) {

        // update rIndex
        rIndex = tModel.tRows.length-1;
      }

      // minimal check
      if ( this.validateRow(rIndex) ) {

        /// return row
        return new Row( tModel.tRows[rIndex] );
      }

      // resume
      return false;
    }

    /**
     * get rows by their checked state
     * @param  {[type]} checkedState [description]
     * @return {[type]}              [description]
     */
    getCheckedRows(checkedState) {
      var selectedRows = this.getSelectedRows( true );

      // update checked state
      checkedState = checkedState || false;

      // filter visible rows
      return filter(selectedRows, function(row){

        // filter criteria
        return row.data[0] == checkedState;
      });
    }

    /**
     * get visible rows
     * @return {array} return an array of visible rows
     */
    getVisibleRows() {

      // return dirty rows
      return this.getRowsBy( 'hidden', 0 );
    }

    /**
     * get selected rows. used in the filter function
     * @param  {[type]} selectedState [description]
     * @return {[type]}               [description]
     */
    getSelectedRows(selectedState) {
      var visibleRows = this.getVisibleRows();

      // update selected state
      selectedState = selectedState || false;

      // filter visible rows
      return filter(visibleRows, function(row){

        // filter criteria
        return row.selected == selectedState;
      });
    }

    /**
     * get dirty rows
     * @return {array} - returns an array of dirty rows
     */
    getDirtyRows() {

      // return dirty rows
      return this.getRowsBy( 'isDirty', 1 );
    }

    /**
     * udpate row by given attribute
     * @param  {string|number} attr - given attribute
     * @param  {object} newRow - row object
     * @return {object|boolean} returns updated row or false if error
     */
    updateRowBy(attr, value, newRow) {
      var i,
        updated = false,
        tRows = this.model.get( 'tRows' );

      // loop through each table row
      for ( i=0; i<tRows.length; i++ ) {

        // check row attribute
        if ( !updated && tRows[i][attr] == value ) {

          // update table row
          extend( tRows[i], newRow.toJSON() );

          // update flag
          updated = true;

          // break the loop
          break;
        }
      }

      // check updated flag
      if ( updated ) {

        // update table rows
        this.model.set( 'tRows', tRows );

        // resume
        return newRow;
      }

      // resume
      return false;
    }

    /**
     * create an empty row and prefill data array. also add dynamic random id and compute dirty
     * @param  {array} data - data array to prefill new row with [description]
     * @return {object} - new row
     */
    getEmptyRow(data) {
      var tModel = this.model.toJSON();

      // extra
      var extra = tModel.tExtra ? 1 : 0;

      // create new row
      var row = new Row({
        extra: extra,
        removable: tModel.tRemovable
      });

      // fill empty row
      row.fillData( tModel.properties.lastHeaderLength, data );

      // resume
      return row;
    }

    /**
     * will add a new row into table model and will return updated rows length
     * @param  {[type]} newRow [description]
     * @return {[type]}        [description]
     */
    insertRow(newRow) {

      // get table model
      var tModel = this.model.toJSON();

      // update table model rows
      tModel.tRows.push( newRow );

      // update table model props
      tModel.properties.rowsLength += 1;

      // update dirty
      tModel.tDirty = true;

      // update view model
      this.model.set( tModel );

      // resume
      return tModel.properties.rowsLength;
    }

    // open row modal for create/edit/delete actions
    openRowDialog(opt) {

      var b1 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[opt.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[opt.lang];

      var firstDate,
        _self  = this,                                        // table component
        fIndex = 0,                                           // field index
        fields = [],                                          // fields array
        rowId  = getProp( opt, ['rowId'], 'a' ),              // row id
        icMode = getProp( opt, ['icon'], 'glyphicon-plus' ),  // dialog title icon
        posTit = getProp( opt, ['positiveTitle'], b1 ),
        negTit = getProp( opt, ['negativeTitle'], b2 );

      var hasCheckmark = getProp( opt, ['check'], false );
      var tRow = this.getRowsBy( 'id', rowId, true );

      if ( !tRow ) return false;

      var filterIdx = 0;
      var dateFormat = session.get( 'settings', 'dateFormat' );
      var lastHeader = this.getLastHeader();

      if( !includes(['batch', 'create', 'edit', 'delete'], opt.mode) ) {
        $.publish( 'toast', [3, '@openRowDialog() called with unknown mode!'] );
        return;
      }

      switch( opt.mode ) {
      case 'batch':
      case 'create':

        // map through last header to create form fields
        map(lastHeader, function(field, index){
          var el, setDate, currentFilter,
            value = '',
            dirty = false,
            labelTitle = '';

          // column is not visible or read only
          if ( field.bReadOnly || !field.bVisible ) return false;

          // check top level title
          if ( field.sToplevel ) {

            // update label title
            labelTitle = field.sToplevel.replace(/\//g, '-');

            // check label title length
            if ( labelTitle.length > 11 ) {

              // remove extra characters from label title
              labelTitle = labelTitle.substring( 0, 12 ) + '... ';
            }
          }

          // add support for todays date on date fields
          if ( field.iClick == 3 ) {

            // check if should set date
            setDate = includes( ['EntryDate', 'ExitDate'], field.sClass );

            // check if field should be filled in with todays date
            if ( (opt.setDate && !firstDate) || setDate ) {

              // update first date flag
              firstDate = true;

              // update value
              // value = Moment().format( dateFormat ).toString();
              value = DateFormat.asString( dateFormat, new Date() );

              // update dirty field
              dirty = true;
            }
          }

          // check if already value is set
          if ( !value && opt.hasOwnProperty('filterRow') && isArray(opt.filterRow) ) {

            // get current filter
            currentFilter = opt.filterRow[ filterIdx ];

            // check current index
            if ( currentFilter && currentFilter.col == index ) {

              // update filter index
              filterIdx += 1;

              // get value
              value = currentFilter.val;

              // update dirty
              dirty = true;
            }
          }

          // create new element
          el = {
            class: 'col-xs-7 col-sm-7',
            label: {
              class: 'col-xs-5 col-sm-5',
              value: labelTitle + field.sTitle
            },
            col: index,
            group: field.iGroup,
            findex: fIndex,
            type: field.iClick,
            val: value,
            dirty: dirty
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
        break;
      case 'edit':

        // map through last header to create form fields.
        // build form only from visible columns
        map(lastHeader, function(field, index){
          var el, setDate, value,
            dirty = false,
            labelTitle = '';

          if( !field.bVisible ) return false;

          // check top level title
          if ( field.sToplevel ) {

            // update label title
            labelTitle = field.sToplevel.replace(/\//g, '-');

            // check label title length
            if ( labelTitle.length > 11 ) {

              // remove extra characters from label title
              labelTitle = labelTitle.substring( 0, 12 ) + '... ';
            }
          }

          // add support for todays date on date fields
          if ( field.iClick == 3 ) {

            // check if should set date
            setDate = includes( ['EntryDate', 'ExitDate'], field.sClass );

            // check if field should be filled in with todays date
            if ( (opt.setDate && !firstDate) || setDate ) {
              firstDate = true;
              // value = Moment().format( dateFormat ).toString();
              value = DateFormat.asString( dateFormat, new Date() );
              dirty = true;
            }
          }

          el = {
            class: 'col-xs-7 col-sm-7',
            label: {
              class: 'col-xs-5 col-sm-5',
              value: labelTitle + field.sTitle
            },
            col: index,
            findex: fIndex,
            rowId: tRow.getId(),
            val: value || tRow.getValue( index ),
            dirty: dirty
          };

          // column is not visible or read only
          el.type = field.bReadOnly ? 0 : field.iClick;

          // check if field has sDropDown
          if ( getProp(field, ['sDropDown']) ) {

            // attach options attribute
            el.options = field.sDropDown.replace(/""/g, '');
          }

          // update fields
          fields.push( el );

          // update field index
          fIndex ++;
        });

        if ( hasCheckmark ) {

          // update fields
          fields.push({
            class: 'col-xs-7 col-sm-7',
            label: {
              class: 'col-xs-5 col-sm-5',
              value: 'Markering'
            },
            col: -1,
            findex: fIndex,
            type : 4,
            rowId: tRow.getId(),
            val: tRow.check(),
            dirty: false
          });
        }
        break;
      case 'delete':
        break;
      }

      // form model
      var formModel = new FormModel({ elements: fields });

      // create new form view
      var formView = new FormView({ model: formModel, lang: opt.lang });

      // listen for 'error' events
      formView.on('error', function( error ){

        // update error on parent view
        dialogView.model.set( 'error', error );
      });

      // create dialog model
      var dialogModel = new DialogModel({
        id: 'add_row_event',
        icon: icMode,
        title: opt.title,
        visible: false,
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
          icon: icMode,
          visible: true,
          event: 'positive'
        }]
      });

      // instantiate new dialog view
      var dialogView = new DialogView({
        model: dialogModel,
        lang: opt.lang
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

        // check mode
        if ( opt.mode == 'batch' ) {

          // show spinner
          $.publish( 'spinner', [true] );

          // trigger event further and resume
          return _self.trigger( 'positive', this, opt, serializedForm );
        }

        // get updated row
        if ( !tRow.updateFields(serializedForm, true) ) {

          // resume
          return;
        }

        // trigger event further
        _self.trigger( 'positive', this, opt, tRow );
      });

      // listen for 'negative' event
      dialogView.on('negative', function(){

        // trigger add-row event further
        _self.trigger( 'negative', this, opt );
      });

      // listen for 'visible' event
      dialogView.on('visible', function(){

        // focus first input field
        formView.focusInput();
      });

      // insert form view inside dialog view
      dialogView.setView( '.body-component', formView );

      // return dialog view
      return dialogView;
    }

    // open row in a form dialog (new type) for
    // create/edit/delete actions
    openNewRowDialog(opt) {

      var b1 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[opt.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[opt.lang];
      var b3 = session.get( 'sp_lang', 'SP_LabelsMarking') || Language.labels.marking[opt.lang];

      var _self  = this,                                      // table component
        iGroup = -1,                                          // current group
        fIndex = 0,                                           // field index
        fields = [],                                          // fields array
        groups = [],                                          // group of fiels
        mode   = getProp( opt, ['mode'] ),                    // dialog mode: create/edit + update/delete
        rowId  = getProp( opt, ['rowId'], 'a' ),              // row id
        title  = getProp( opt, ['title'], '' ),               // dialog title
        icMode = getProp( opt, ['icon'], 'glyphicon-plus' ),  // modal icon
        posTit = getProp( opt, ['positiveTitle'], b1 ),
        negTit = getProp( opt, ['negativeTitle'], b2 );

      // get table row
      var tRow = this.getRowsBy( 'id', rowId, true );

      // validate table row -> resume early
      if ( !tRow ) return false;

      // get last header
      var lastHeader = this.getLastHeader();

      // check mode
      switch( mode ) {
      case 'edit':

        // map through last header to create form fields.
        // build form only from visible columns
        map(lastHeader, function(field, index){
          var selectOpt;

          // for id and dirty fields -> resume early
          if( !field.bVisible ) return false;

          // local vars
          var el = {
            class: 'col-xs-7 col-sm-7',
            label: {
              class: 'col-xs-5 col-sm-5',
              value: field.sTitle
            },
            formClass: 'form-group-sm',
            col: index,
            group: field.iGroup,
            findex: fIndex,
            rowId: tRow.getId(),
            val: tRow.getValue( index ),
            dirty: false,
          };

          // column is not visible or read only
          if ( field.bReadOnly ) {

            // set element type
            el.type = 0;

            // update element class
            el.formClass += ' static-field';
          } else {
            el.type = field.iClick;
          }

          // if checkmark column
          if( el.type < 0 ) {

            // update field label
            el.label.value = b3;
          }

          // check if field has sDropDown
          if ( getProp(field, ['sDropDown']) ) {

            // attach options attribute
            el.options = field.sDropDown.replace(/""/g, '');

            // update value with text
            try{
              selectOpt = JSON.parse( el.options );
            } catch( e ){

              // log
              log( e );
              log( el.options );
            }

            // update value
            if ( !el.type && selectOpt ) {

              // update value
              el.val = selectOpt[ el.val ];
            }
          }

          // update fields
          fields.push( el );

          // update field index
          fIndex ++;

          // check group
          if ( iGroup !== field.iGroup ) {

            // update iGroup
            iGroup += 1;

            // append new group
            groups.push({
              title: '',
              fields: []
            });
          }

          // check group title
          if ( !groups[iGroup].title ) {

            // set group title
            groups[iGroup].title = field.sToplevel;
          }

          // update current group
          groups[iGroup].fields.push( el );
        });
        break;
      default:

        // toast
        $.publish( 'toast', [3, '@openRowDialog() called with unknown mode!'] );

        // define skip
        var skip = true;

        // resume
        if ( skip ) {

          // resume
          return;
        }
        break;
      }

      // form model
      var formModel = new ComplexFormModel({ groups: groups });

      // create new form view
      var formView = new ComplexFormView({ model: formModel, lang: this.lang });

      // listen for 'error' events
      formView.on('error', function( error ){

        // update error on parent view
        dialogView.model.set( 'error', error );
      });

      // create dialog model
      var dialogModel = new DialogModel({
        id: 'add_row_event',
        icon: icMode,
        title: title,
        visible: false,
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
          icon: icMode,
          visible: true,
          event: 'positive'
        }]
      });

      // instantiate new dialog view
      var dialogView = new DialogView({
        model: dialogModel,
        lang: opt.lang || this.lang
      });

      // listen for 'positive' event
      dialogView.on('positive', function(){

        // get form data
        var serializedForm = formView.serializeForm();

        // log
        log( 'object', serializedForm );

        // check for form errors
        if ( !serializedForm ) {

          // hide dialog
          this.toggle();

          // resume
          return;
        }

        // get updated row
        if ( !tRow.updateFields(serializedForm, true) ) {

          // resume
          return;
        }

        // trigger event further
        _self.trigger( 'positive', this, opt, tRow );
      });

      // listen for 'negative' event
      dialogView.on('negative', function(){

        // trigger add-row event further
        _self.trigger( 'negative', this, opt );
      });

      // listen for 'visible' event
      dialogView.on('visible', function(){

        // focus first input field
        formView.focusInput();
      });

      // listen for 'hidden' event
      dialogView.on('hidden', function(){

        // remove dialog
        this.remove();
      });

      // insert form view inside dialog view
      dialogView.setView( '.body-component', formView );

      // resume
      return dialogView;
    }

    // open filter dialog to filter rows
    openFilterDialog(opt) {

      var b1 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[opt.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[opt.lang];
      var b3 = session.get( 'sp_lang', 'SP_LabelsMarking') || Language.labels.marking[opt.lang];

      var _self  = this,                                      // table component
        iGroup = -1,                                          // current group
        fIndex = 0,                                           // field index
        fields = [],                                          // fields array
        groups = [],                                          // group of fiels
        posTit = getProp( opt, ['positiveTitle'], b1 ),
        negTit = getProp( opt, ['negativeTitle'], b2 );

      // get last header
      var lastHeader = this.getLastHeader();

      // reset filter index
      var filterIdx = 0;

      // map through last header to create form fields.
      // build form only from visible columns
      map(lastHeader, function(field, index){
        var val;

        // for id and dirty fields
        if( !field.bVisible ) return false;

        // get current filter
        var currentFilter = opt.filterRow[ filterIdx ];

        // check current index
        if ( currentFilter && currentFilter.col == index ) {

          // update filter index
          filterIdx += 1;

          // get value
          val = currentFilter.val;
        } else {
          val = '';
        }

        // default field type
        var fType = 'text';

        // check iClick
        if ( field.iClick == 1 || field.iClick == 11 ) {

          // update field type
          fType = 'number';
        }

        // local vars
        var el = {
          class: 'col-xs-5 col-sm-5',
          label: {
            class: 'col-xs-7 col-sm-7',
            value: field.sTitle
          },
          col: index,
          group: field.iGroup,
          findex: fIndex,
          id: 'filter_' + fIndex,
          val: val,
          dirty: false,
          type: field.iClick,
          fType: fType
        };

        // field belongs to checkmark column
        if( el.type < 0 ) {

          // update filter label
          el.label.value = b3;
        }

        // update fields
        fields.push( el );

        // update field index
        fIndex ++;

        // check group
        if ( iGroup !== field.iGroup ) {

          // update iGroup
          iGroup += 1;

          // append new group
          groups.push({
            title: '',
            fields: []
          });
        }

        // check group title
        if ( !groups[iGroup].title ) {

          // set group title
          groups[iGroup].title = field.sToplevel;
        }

        // update current group
        groups[iGroup].fields.push( el );
      });

      // form model
      var formModel = new ComplexFormModel({ groups: groups });

      // create new form view
      var formView = new ComplexFormView({
        model: formModel,
        template: filterFormTpl,
        filter: true,
        lang: opt.lang
      });

      // create dialog model
      var dialogModel = new DialogModel({
        id: 'add_row_event',
        icon: opt.icon,
        title: opt.title,
        visible: false,
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
          class: 'btn-danger',
          icon: 'glyphicon-remove',
          title: 'Clear all',
          visible: true,
          event: 'clear-filter'
        }, {
          class: 'btn-primary',
          title: posTit,
          icon: opt.icon,
          visible: true,
          event: 'positive'
        }]
      });

      // instantiate new dialog view
      var dialogView = new DialogView({
        model: dialogModel,
        lang: opt.lang
      });

      // listen for 'positive' event
      dialogView.on('positive', function(){

        // get form data
        var filterRow = formView.getFilter();

        // check for form errors
        if ( !filterRow ) {

          // hide dialog
          this.toggle();

          // resume
          return;
        }

        // trigger event further
        _self.trigger( 'positive', this, opt, filterRow );
      });

      // listen for 'negative' event
      dialogView.on('negative', function(){

        // trigger add-row event further
        _self.trigger( 'negative', this, opt );
      });

      // listen for 'clear-filter' event
      dialogView.on('clear-filter', function(){

        // trigger clear-filter event further
        formView.clearAllFields();
      });

      // listen for 'visible' event
      dialogView.on('visible', function(){

        // focus first input field
        formView.focusInput();
      });

      // listen for 'hidden' event
      dialogView.on('hidden', function(){

        // remove dialog
        this.remove();
      });

      // insert form view inside dialog view
      dialogView.setView( '.body-component', formView );

      // resume
      return dialogView;
    }

    openBatchRegistrationDialog(opt) {

      var b1 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[opt.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[opt.lang];

      var firstDate,
        _self  = this,                                        // table component
        fIndex = 0,                                           // field index
        fields = [],                                          // fields array
        rowId  = getProp( opt, ['rowId'], 'a' ),              // row id
        icMode = getProp( opt, ['icon'], 'glyphicon-plus' ),  // dialog title icon
        posTit = getProp( opt, ['positiveTitle'], b1 ),
        negTit = getProp( opt, ['negativeTitle'], b2 );

      // get table row
      var tRow = this.getRowsBy( 'id', rowId, true );

      // check table row
      if ( !tRow ) return false;

      // reset filter index
      var filterIdx = 0;
      var dateFormat = session.get( 'settings', 'dateFormat' );
      var lastHeader = this.getLastHeader();

      if( !includes(['batch', 'create', 'edit', 'delete'], opt.mode) ) {

        // toast
        $.publish( 'toast', [3, '@openRowDialog() called with unknown mode!'] );

        // resume
        return;
      }

      // map through last header to create form fields
      map(lastHeader, function(field, index){
        var el, setDate, currentFilter,
          value = '',
          dirty = false,
          labelTitle = '';

        // column is not visible or read only
        // if ( field.bReadOnly || !field.bVisible || (field.hasOwnProperty('bBatch') && !field.bBatch) ) return false;
        if ( field.bReadOnly || !field.bVisible ) return false;

        // check top level title
        if ( field.sToplevel ) {

          // update label title
          labelTitle = field.sToplevel.replace(/\//g, '-');

          // check label title length
          if ( labelTitle.length > 11 ) {

            // remove extra characters from label title
            labelTitle = labelTitle.substring( 0, 12 ) + '... ';
          }
        }

        // add support for todays date on date fields
        if ( field.iClick == 3 ) {

          // check if should set date
          setDate = includes( ['EntryDate', 'ExitDate'], field.sClass );

          // check if field should be filled in with todays date
          if ( (opt.setDate && !firstDate) || setDate ) {

            // update first date flag
            firstDate = true;

            // update value
            // value = Moment().format( dateFormat ).toString();
            value = DateFormat.asString( dateFormat, new Date() );

            // update dirty field
            dirty = true;
          }
        }

        // check if already value is set
        if ( !value && opt.hasOwnProperty('filterRow') && isArray(opt.filterRow) ) {

          // get current filter
          currentFilter = opt.filterRow[ filterIdx ];

          // check current index
          if ( currentFilter && currentFilter.col == index ) {

            // update filter index
            filterIdx += 1;

            // get value
            value = currentFilter.val;

            // update dirty
            dirty = true;
          }
        }

        // bBatch
        var bBatch = true;

        // check bBatch
        if ( field.hasOwnProperty('bBatch') ) {

          // update bBatch
          bBatch = field.bBatch;
        }

        // create new element
        el = {
          class: 'col-xs-7 col-sm-7',
          label: {
            class: 'col-xs-5 col-sm-5',
            value: labelTitle + field.sTitle,
            glyph: true
            // value: '<p class="text-danger"><span class="glyphicon glyphicon-minus"></span>' + labelTitle + field.sTitle + '</p>'
            // value: '<span class="glyphicon glyphicon-minus"></span>' + labelTitle + field.sTitle
          },
          col: index,
          group: field.iGroup,
          findex: fIndex,
          type: field.iClick,
          val: value,
          dirty: dirty,
          visible: bBatch
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

      /*// define toggle button html value
      var toggleBtn = '<button type="button" class="btn btn-default">' +
                      '<span class="glyphicon glyphicon-minus" aria-hidden="true"></span> Toggle fields visibility' +
                      '</button>';*/
      var toggleBtn = '<a class="toggle-fields" data-col="-1"><span class="glyphicon glyphicon-minus" aria-hidden="true"></span> Show hidden fields</a>';

      // update form to include show/hide button
      // fields.push({
      fields.unshift({
        visible: true,
        class: 'col-xs-7 col-sm-7',
        label: {
          class: 'col-xs-5 col-sm-5',
          // value: 'Toggle fields'
          // value: '<a class="hide-field"><span class="glyphicon glyphicon-minus" aria-hidden="true"></span> Hide field</a>'
          value: ''
        },
        col: -1,
        group: -1,
        findex: -1,
        type: 17,
        // val: '<span class="glyphicon glyphicon-minus"></span>',
        val: toggleBtn,
        dirty: false
      });

      // form model
      var formModel = new FormModel({ elements: fields });

      // create new form view
      // var formView = new FormView({ model: formModel, lang: opt.lang });
      var formView = new BatchRegistrationFormView({ model: formModel, lang: opt.lang });

      // listen for 'error' events
      formView.on('error', function( error ){

        // update error on parent view
        dialogView.model.set( 'error', error );
      });

      // create dialog model
      var dialogModel = new DialogModel({
        id: 'add_row_event',
        icon: icMode,
        title: opt.title,
        visible: false,
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
          icon: icMode,
          visible: true,
          event: 'positive'
        }]
      });

      // instantiate new dialog view
      var dialogView = new DialogView({
        model: dialogModel,
        lang: opt.lang
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

        // check mode
        if ( opt.mode == 'batch' ) {

          // show spinner
          $.publish( 'spinner', [true] );

          // trigger event further and resume
          return _self.trigger( 'positive', this, opt, serializedForm );
        }

        // get updated row
        if ( !tRow.updateFields(serializedForm, true) ) {

          // resume
          return;
        }

        // trigger event further
        _self.trigger( 'positive', this, opt, tRow );
      });

      // listen for 'negative' event
      dialogView.on('negative', function(){

        // trigger add-row event further
        _self.trigger( 'negative', this, opt );
      });

      // listen for 'visible' event
      dialogView.on('visible', function(){

        // focus first input field
        formView.focusInput();
      });

      // insert form view inside dialog view
      dialogView.setView( '.body-component', formView );

      // return dialog view
      return dialogView;
    }

    /**
     * popup open row by attr and value
     * @param  {string} attr - query attribute
     * @param  {Object} value - query value
     */
    popupRowBy(attr, value , tRow) {

      // get row
      tRow = tRow || this.getRowsBy( attr, value, true );

      // validate row
      if ( !tRow ) {

        // toast
        $.publish( 'toast', [2, 'row with ' + attr + ' = ' + value + ' could not be found!'] );

        // resume
        return;
      }

      // labels
      var b1 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[this.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[this.lang];
      var b3 = session.get( 'sp_lang', 'SP_ButtonEditRow') || Language.button.editRow[this.lang];

      // open row dialog
      return this.openNewRowDialog({
        mode         : 'edit',
        icon         : 'glyphicon-edit',
        check        : true,
        group        : true,
        rowId        : tRow.getId(),
        title        : b3,
        positiveTitle: capitalize( b1 ),
        negativeTitle: b2
      });
    }

    /**
     * filter table -> dom operation. debounce filter operation
     * so that it triggers more seldom
     * @param  {[type]} iLocation [description]
     * @param  {[type]} value     [description]
     * @return {[type]}           [description]
     */
    filterTable(iLocation, value){

      // get location filter
      var locationFilter = this.$( 'td:nth-child(' + iLocation + ')' );

      // filter through each cell
      locationFilter.each(function( i, val ) {

        // get cell content
        var cellContent = $.trim( $( this ).text() ).toLowerCase();

        // check if cell has value
        if ( cellContent.indexOf( value )<0 ) {

          // hide row
          // $( val ).parent( 'tr' ).hide();
          $( val ).parent( 'tr' ).attr( 'data-hidden', 'true' );
        } else {

          // reveal row
          // $( val ).parent( 'tr' ).show();
          $( val ).parent( 'tr' ).attr( 'data-hidden', 'false' );
        }
      });
    }

    /**
     * find animal by query
     * @param {string} query string
     * @return {boolean} true if animal found and false otherwise
     */
    findAnimal(attr, value) {
      var i, animal;

      // get animals
      var animals = this.model.get( 'animals' );

      // loop through animals
      for( i = 0; i<animals.length; i++ ) {

        // get current animal
        animal = new Row( animals[i] );

        // check if serial number exists in the animals list
        if ( animal.get(attr) == value ) {

          // switch row from animals list to rows list
          animal.set({ animal: 0, isDirty: 1 });

          // resume
          return animal;
        }
      }

      // resume
      return false;
    }

    /**
     * mark row by attribute and value. get row by attribute and value and mark it
     * @param  {String} attr - string attribute
     * @param  {Object} value - value
     * @return {[type]}       [description]
     */
    markRowBy(attr, value, tRow) {

      // get row
      tRow = tRow || this.getRowsBy( attr, value, true );

      // validate row
      if ( !tRow ) {

        // toast
        $.publish( 'toast', [2, 'row with ' + attr + ' = ' + value + ' could not be found!'] );

        // resume
        return;
      }

      // check if row is already marked
      if ( tRow.mark() ) return tRow;

      // set row as marked
      tRow.mark( 1 );

      // resume
      return this.updateRowBy( attr, value, tRow );
    }

    /**
     * hide row with specific index
     * @param  {number|string} rIndex - row index
     * @param  {boolean} bool - specifies if should also remove the row from
     * view model or not
     * @return {promise|boolean} - returns a promise or false if operation fails
     */
    hideRow(rIndex) {

      // keep refference to this table view
      var self = this;

      // validate row index -> resume early
      if ( !this.validateRow(rIndex) ) return false;

      // just remove the row from data object and rerender the table
      var delRowQuery = 'tbody tr:eq(' + rIndex + ')';

      // return promise
      return this.$( delRowQuery ).fadeOut( 'fast' ).promise().then(function() {

        // remove row from the table
        self.$( delRowQuery ).remove();
      });
    }

    // get dom row by row id
    getDomRowById(rowId) {
      var $query = 'tbody tr[data-rowid="' + rowId + '"]';

      // get row
      var $row = this.$( $query );

      // validate row -> resume early
      if ( !$row.length ) return false;

      // resume
      return $row;
    }

    // get dom row by row id
    getDomRowBy(rowId) {
      var $query = 'tbody tr[data-rowid="' + rowId + '"]';

      // get row
      var $row = this.$( $query );

      // validate row -> resume early
      if ( !$row.length ) return false;

      // resume
      return $row;
    }

    /**
     * hide row with given id
     * @param  {number|string} rowId - given row id
     * @param  {boolean} bool - specifies if should also remove the row from
     * view model or not
     * @return {promise|boolean} - returns a promise or false if operation fails
     */
    hideRowById(rowId) {
      var $row = this.getDomRowById( rowId );

      // validate row -> resume early
      if ( !$row ) return false;

      // return promise
      return $row.fadeOut( 'fast' ).promise().then(function() {

        // remove row from the table
        $row.remove();
      });
    }

    /**
     * hide row with given attribute
     * @return {promise|boolean} - returns a promise or false if operation fails
     * TODO
     */
    hideRowBy() {

      // resume
      return;
    }

    /**
     * mark row as deleted
     * @param  {number|string} rIndex - row index
     * @return {number|boolean} - returns row dirty value, or false
     * if operation fails
     */
    markDeleted(rIndex) {

      // get table model
      var tModel = this.model.toJSON();

      // minimal check
      if ( this.validateRow(rIndex) ) {

        // update row dirty, mark it as deleted
        return this.setDirty( rIndex, Math.pow(2, tModel.tRows[rIndex].data.length) );
      }

      // resume
      return false;
    }

    /**
     * restore deleted row. mark it as not hidden.
     * swap dirty with restore dirty value
     * @param  {number|string} rIndex - row index
     * @return {number|boolean} - returns row dirty value, or false
     * if operation fails
     */
    restoreDeleted(rIndex) {

      // log
      log( 'restore deleted row: ' + rIndex );
    }

    /**
     * will silently hide a row and mark it as delted. then it will publish
     * an event, so that upper modules can react upon remove row
     * @param  {number|string} rIndex - row index
     * @return {promise|boolean} - returns a promise or false, if operation fails
     */
    removeRow() {

      // resume
      return false;
    }

    /**
     * remove row by id. hide and remove it from the dom
     * @param  {number|string} rowId - row id to be removed
     * @param  {boolean} toggle - toggle remove/restore
     * @return {promise|boolean} - returns promise or false if error
     */
    removeRowById(rowId) {
      var promise = this.hideRowById( rowId );

      // if valid promise
      if ( promise ) {

        // resume
        return promise.then(function(){

          // delete row by Id
          this.deleteRowId( rowId );
        }.bind(this));
      }

      // resume
      return false;
    }

    /**
     * deletes row from view model
     * @param  {number|string} rIndex - row index
     * @return {boolean} - true if success or false if operation fails
     */
    deleteRow(row) {
      var i,
        tModel = this.model.toJSON();

      // minimal check
      if ( utils.isInt(row.getId()) && tModel.properties.rowsLength ) {

        // get index of row with given id
        for ( i=0; i<tModel.tRows.length; i++ ) {

          // check row with id
          if ( tModel.tRows[i].id == row.getId() ) {

            // remove row
            tModel.tRows.splice(i, 1);

            // update rows length
            tModel.properties.rowsLength -= 1;

            // update model
            this.model.set( tModel );

            // resume
            return true;
          }
        }
      }

      // resume
      return false;
    }

    /**
     * delete row with attribute = value
     * @param  {string} attr - key attribute
     * @param  {string|number|boolean} value
     * @return {number}       returns the number of elements removed
     */
    deleteRowBy(attr, value) {
      var tModel = this.model.toJSON();

      // remove item from array (mutates array)
      // returns an array with removed items
      var rowArr = remove(tModel.tRows, function( row ){

        // filter criteria
        return row[ attr ] == value;
      });

      // check new length -> resume early
      if ( !rowArr.length ) return false;

      // update table properties
      tModel.properties.rowsLength = tModel.tRows.length;

      // update model
      this.model.set( tModel );

      // resume
      return rowArr.length;
    }

    /**
     * deletes row from view model
     * @param  {string|number} rowId - row id
     * @return {boolean} - true on success, false on error
     */
    deleteRowId(rowId) {
      var i,
        tModel = this.model.toJSON();

      // minimal check
      if ( utils.isInt(rowId) && tModel.properties.rowsLength ) {

        // get index of row with given id
        for ( i=0; i<tModel.tRows.length; i++ ) {

          // check row with id
          if ( tModel.tRows[i].id == rowId ) {

            // remove row
            tModel.tRows.splice(i, 1);

            // update rows length
            tModel.properties.rowsLength -= 1;

            // update model
            this.model.set( tModel );

            // resume
            return true;
          }
        }
      }

      // resume
      return false;
    }

    /**
     *
     */
    updateLayoutByRow(layout, data) {

      // define vars
      var i, j,
        tHeadLen = layout.thead.length;

      // loop through data fields
      for ( i=0; i<data.length; i++ ) {

        // check data column
        if ( data[i].col == -1 ) continue;

        // loop through layout and update the corresponding bBatch
        for ( j=0; j<layout.thead[tHeadLen - 1].th.length; j++ ) {

          // check header column
          if ( j == data[i].col ) {

            // update bBatch
            layout.thead[tHeadLen - 1].th[j].bBatch = data[i].visible;

            // skip loop
            break;
          }
        }
      }

      // update layout by request key
      if ( utils.setLayoutBy('requestKey', layout.requestKey, layout) ) {

        // update layout
        this.model.set( 'layout', layout );

        // success
        return true;
      }

      // fail
      return false;
    }

    /**
     * run batch with data
     * @param  {array} data - array of objects containing the column index and
     * value that should be batch updated on all the visible rows
     * @return {boolean} - return true for success or expect an error if fail.
     */
    runBatch(data, skipBatchCheck) {
      var i, j,

        // number of edited rows
        // e = 0,
        tModel = this.model.toJSON();

      // add support for updated rows
      var uRows = [];

      // loop through batch data
      for ( i=0; i<data.length; i++ ) {

        // loop through each row
        for( j=0; j<tModel.properties.rowsLength; j++ ) {

          // run batch only on checked rows
          // if ( tModel.tRows[j].data[0] === 0 ) continue;
          if ( tModel.tRows[j].data[0] ) {

            // if row is marked as deleted -> skip row
            if ( tModel.tRows[j].hidden ) continue;

            // field is not dirty -> skip row
            if ( !getProp(data[i], 'dirty') ) continue;

            // skip batch check
            if ( typeof skipBatchCheck === 'undefined' ) {

              // bBatch == false
              if ( tModel.tRows[j].hasOwnProperty('bBatch') && !tModel.tRows[j].bBatch ) continue;

              // hidden field
              if ( !getProp(data[i], 'visible') ) continue;
            }

            // update value
            if ( typeof this.setValue( j, data[i].col, data[i].val, true ) == 'undefined' ) return;

            // increment sucessfully edited rows
            // e++;

            // update list of rows
            uRows.push( tModel.tRows[j] );
          }
        }
      }

      // resume
      // return e;
      return uRows;
    }

    /**
     * returns a jquery table cell to work with
     * @param  {[type]} rIndex [description]
     * @param  {[type]} cIndex [description]
     * @return {[type]}        [description]
     */
    getTableCell(rIndex, cIndex) {

      // cache table body element
      var tBody = this.$( 'tbody' )[0];

      // get next cell
      var cell = tBody.rows[rIndex].cells[cIndex];

      // return cell
      return this.$( cell );
    }

    /**
     * edit next cell based on current row index and column index
     * @param  {number|string} rIndex - row index
     * @param  {number|string} cIndex - column index
     */
    editNextCell(rIndex, cIndex) {
      var iClick,
        tExtra = this.model.get( 'tExtra' ),
        props = this.model.get( 'properties' ),
        headerLength = tExtra ? props.lastHeaderLength -2 : props.lastHeaderLength;

      // define starting point
      var i = cIndex + 1;

      // loop through next cells
      for ( i; i<headerLength; i++ ) {

        // get iClick
        iClick = this.getColumnProperty( i, 'iClick' );

        // extra check
        // if ( $cell.hasClass('.toggleDelete') ) return;
        if ( iClick == 3 ) return;

        // check if read only column
        if ( this.getColumnProperty(i, 'bReadOnly') || this.getValue(rIndex, i) == '\u200B' || iClick == 3 ) {

          // skip loop
          continue;
        }

        // get table cell
        var $cell = this.getTableCell( rIndex, i );

        // check iClick
        if ( iClick == 1 || iClick == 2 ) {

          // get input fielf
          var $inputField = $cell.find( '.e-cell-input' );

          // check if any field found
          if ( $inputField.length === 0 ) {

            // simply trigger click
            return $cell.trigger( 'click' );
          }

          // caret position
          var cPos = 0;

          // get value
          var inputVal = $inputField.val();

          // check if value is not undefined
          if ( inputVal !== undefined ) {

            // update caret position
            cPos = +inputVal.length;
          }

          // get hold of the input field
          return $inputField.focus().caret( cPos );
        }

        // trigger click and resume
        return $cell.trigger( 'click' );
      }
    }

    showDatePicker(rIndex, cIndex) {
      var dateFormat = session.get( 'settings', 'dateFormat' );

      var $cell = this.getTableCell( rIndex, cIndex );

      // check if datepicker plugin was not already called
      // this change doesn't fix the issue of triggering 'show' 2 times
      // see bug here: https://github.com/eternicode/bootstrap-datepicker/issues/912
      if ( $.isEmptyObject($cell.data()) ) {

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

      // resume
      return $cell;
    }

    processEvent(e) {
      var newValue,
        $target = this.$( e.currentTarget );

      // if date changed
      if ( e.format() !== '' ) {
        newValue = e.format();
      } else {
        newValue = e.target.innerHTML;
      }

      // update date
      $target.text( newValue );
    }

    cleanup() {

      // remove any previous events
      $( window ).off( 'scroll' );
    }
  };
};
