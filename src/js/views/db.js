'use strict';

// lodash functions
import { map, clone, assign, isArray } from 'lodash';

// get data
import { rows } from '../data/fake-rows';

// get fake data
import { sowcard } from '../data/fake-sowcard';

// module local vars
var log;

// define single row
var newRow = {
  'no': 1234567,
  'data': [
    6,
    '21-01-16',
    '',
    0,
    '',
    '10943',
    '',
    '',
    '',
    0,
    0,
    '',
    0,
    0,
    1234567,
    0
  ],
  id: 1234567,
  layout: 'Florin',
  isDirty: 0,
  marked: 0,
  hidden: 0,
  found: 0,
  editable: 1,
  removable: 1,
  animalno: '10943',
  tagid: '09650274514',
  serialno: '02745'
};

// exports
export default ($, debug, dbTables, Layout, Backbone, Database, template, TableView) => {

  return class V extends Layout {

    constructor(o) {
      super(assign({

        // define view template
        template: template,

        // define view events
        events: {
          'click .list-group-item': 'onItemClick',
          'click .clear-all': 'clearAll',
          'click .run-all': 'runAll',
          'click .back': 'onBack',
          'click .insert-multiple': 'insertMultiple'
        }
      }, o));
    }

    initialize() {

      // init log
      log = debug( 'DBView' );

      // listen for 'back' events
      this.on( 'back', this.onBack );
    }

    serialize() {

      // define dbWrapper name
      var dbWrapper = 'dexie';

      // check if db patched
      if ( Modernizr.patchdb ) {

        // update wrapper name
        dbWrapper += '-p';
      }

      // resume
      return {
        dbWrapper: dbWrapper,
        test: [
          { index: 0, title: 'create database' },
          // { index: , title: 'get stores' },
          { index: 8, title: 'insert single row' },
          { index: 1, title: 'insert rows' },
          { index: 9, title: 'insert rows stress test', more: true },
          { index: 2, title: 'get rows' },
          { index: 3, title: 'get row by id' },
          { index: 4, title: 'update row by id' },
          { index: 5, title: 'delete row by id' },
          { index: 6, title: 'empty store' },
          { index: 7, title: 'delete database' }
        ]
      };
    }

    onItemClick(ev) {

      // local vars
      var p;

      // get target element
      var $targetEl = this.$( ev.currentTarget );

      // get current test index
      var idx = $targetEl.data( 'index' );

      // check index
      if ( typeof idx == 'undefined' ) return;

      // show spinner
      $.publish( 'spinner', [true] );

      // get normal table name
      var tName1 = dbTables[0].name;

      // check test index
      switch( idx ) {
      case 0:

        // run create database test
        p = this.createDatabaseTest();
        break;
      case 1:

        // run insert rows test
        p = this.insertRows( tName1, 'Florin' );
        break;
      case 2:

        // run get rows test
        p = this.getRows( tName1, 'Florin' );
        break;
      case 3:

        // run get rows test
        p = this.getRowById( tName1 ,'Florin', 1140 );
        break;
      case 4:

        // run get rows test
        p = this.updateRowById( tName1 ,'Florin', 1140 );
        break;
      case 5:

        // run get rows test
        p = this.deleteRowById( tName1, 1140 );
        break;
      case 6:

        // run empty store test
        p = this.emptyStore( tName1, 'Florin' );
        break;
      case 7:

        // run delete database test
        p = this.deleteDatabaseTest();
        break;
      case 8:

        // run delete database test
        p = this.insertRow( tName1 );
        break;
      }

      // handle errors
      p.then(function(result){

        // log
        log( result );

        // update list item
        $targetEl.removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

        // hide spinner
        $.publish( 'spinner', [false] );
      }, function(err){

        // local vars
        var message = err.message || err.toString();

        // update list item
        $targetEl.removeClass( 'list-group-item-success' ).addClass( 'list-group-item-danger' );

        // hide spinner
        $.publish( 'spinner', [false] );

        // toast
        $.publish( 'toast', [2, message] );
      });
    }

    // get connection
    getConnection() {

      // create db if doesn't exist
      var testDb = Database.get( 'test', dbTables );

      // get connection
      return testDb
        .then(function(connection) {

          // resolve promise
          return connection;
        });
    }

    createDatabaseTest() {

      // get db connection
      return this.getConnection();
    }

    insertRow( tableName ) {

      // get db connection
      return this
        .getConnection()
        .then(function(connection){

          // insert row
          return connection.updateRow( tableName, newRow );
        });
    }

    insertRows(tableName, layout) {

      // log
      log( 'insert ' + rows.length + ' rows' );

      // normalize rows
      let _rows = map(rows, function(row){

        // add layout key
        row.layout = layout;

        // normalize row
        return TableView.prototype.normalizeRow(row);
      });

      // update editable
      map(_rows, function( row ){

        // update editable
        row.editable = row.editable ? 1 : 0;

        // update removable
        row.removable = row.removable ? 1 : 0;
      });

      // log
      log( _rows );

      // get db connection
      return this
        .getConnection()
        .then(function(connection){

          // use connection
          return connection.updateRows( tableName, _rows );
        });
    }

    getRows(tableName, layout) {

      // get rows -> returns promise
      return this
        .getConnection()
        .then((connection) => {

          // use db connection
          return connection.getRowsBy( tableName, {layout: layout, hidden: 0} );
        })
        .then((__rows) => {

          // validate rows
          if ( !isArray(__rows) ) {

            // reject promise
            throw new Error( 'Response is not a collection!' );
          }

          // empty store
          if ( !__rows.length ) {

            // toast
            $.publish( 'toast', [0, 'empty store'] );

            // resolve promise
            return __rows;
          }

          // log
          log( __rows );

          // resolve promise
          return __rows;
        });
    }

    // example
    // return this.getRowById( dbTables[0].name ,'Florin', 1140 );
    getRowById(tableName, layout, id) {

      // get row by id -> returns promise
      return this
        .getConnection()
        .then((connection) => {

          // use db connection
          return connection.getRowBy( tableName, {layout: layout, id: id} );
        })
        .then((row) => {

          // log
          console.log( row );

          // validate row
          if ( !row || !row.hasOwnProperty('id') ) {

            // reject promise
            throw new Error( 'Not a valid row!' );
          }

          // log
          log( JSON.stringify(row) );

          // resolve promise
          return row;
        });
    }

    updateRowById(tableName, layout, id) {

      // get row by id -> returns promise
      return this
        .getConnection()
        .then((connection) => {

          // get row by
          return connection.getRowBy( tableName, {layout: layout, id: id} );
        })
        .then((row) =>{

          // update row
          row.hidden   = 0;
          row.checked  = 0;
          row.isDirty  = 1;
          row.editable = 0;
          row.serialno = 'florincosmin';

          // get connection
          return this
            .getConnection()
            .then((connection) => {

              // use db connection
              return connection.updateRow( tableName, row );
            });
        })
        .then((id) => {

          // check len
          if ( !id ) {

            // reject promise
            throw new Error( 'not valid id!' );
          }

          // resolve promise
          return id;
        });
    }

    deleteRowById(tableName, id) {

      // delete row by id -> returns promise
      return this
        .getConnection()
        .then((connection) => {

          // toast
          // $.publish('toast', [0, 'key type: ' + (typeof id) + ', key value: ' + id]);
          log('toast', [0, 'key type: ' + (typeof id) + ', key value: ' + id]);

          // use db connection
          return connection.deleteRowBy(tableName, {id: id});
        });
    }

    emptyStore(tableName, layout) {
      return this
        .getConnection()
        .then((connection) => {

          // use db connection
          return connection.clearStoreBy( tableName, {layout: layout} );
        });
    }

    deleteDatabaseTest() {

      // remove db
      return Database.remove( 'test' );
    }

    clearAll() {

      // clear everything up
      this.$( '.list-group-item' ).removeClass( 'list-group-item-success list-group-item-danger' );
    }

    runAll() {

      // local vars
      var $targetEls = [];

      // clear all
      this.clearAll();

      // map through target elements
      map(this.$('[data-index]'), function( el ){

        // update promise list
        $targetEls.push( $(el) );
      });

      // show spinner
      $.publish( 'spinner', [true] );

      // process promise
      return this
        .createDatabaseTest()
        .then(() => {

          // update list item
          $targetEls[0].removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

          // insert single row
          return this.insertRow( dbTables[0].name );
        })
        .then(() => {

          // update list item
          $targetEls[1].removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

          // insert rows
          return this.insertRows( dbTables[0].name, 'Florin' );
        })
        .then(() => {

          // update list item
          $targetEls[2].removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

          // get rows
          return this.getRows( dbTables[0].name, 'Florin' );
        })
        .then(() => {

          // update list item
          $targetEls[3].removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

          // get row by id
          return this.getRowById( dbTables[0].name ,'Florin', 1140 );
        })
        .then(() => {

          // update list item
          $targetEls[4].removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

          // update row by id
          return this.updateRowById( dbTables[0].name ,'Florin', 1140 );
        })
        .then(() => {

          // update list item
          $targetEls[5].removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

          // delete row by id
          return this.deleteRowById( dbTables[0].name, 1140 );
        })
        .then(() => {

          // update list item
          $targetEls[6].removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

          // empty store
          return this.emptyStore( dbTables[0].name, 'Florin' );
        })
        .then(() => {

          // update list item
          $targetEls[7].removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

          // delete database
          return this.deleteDatabaseTest();
        })
        .then(() => {

          // update list item
          $targetEls[8].removeClass( 'list-group-item-danger' ).addClass( 'list-group-item-success' );

          // hide spinner
          $.publish( 'spinner', [false] );

          // toast
          $.publish( 'toast', [1, 'all passed!'] );
        })
        .catch((err) => {

          // local vars
          var message = err.message || err.toString() + ' @runAll!';

          // hide spinner
          $.publish( 'spinner', [false] );

          // toast
          $.publish( 'toast', [2, message] );
        });
    }

    onBack() {

      // navigate to previous route
      Backbone.history.navigate( this.previousRoute, { trigger: true } );
    }

    insertMultiple(ev) {

      // save context
      var _ctx = this;

      // prevent default event
      ev.preventDefault();

      // show spinner
      $.publish( 'spinner', [true] );

      // get input field
      var $inputField = this.$( '.form-control' );

      // delay execution to allow spinner to run
      setTimeout(function(){

        // create empty rows array
        var i, s,
          rows = [];

        // get number of rows from the input box
        var numberOfRows = parseInt($inputField.val(), 10) || 500;

        // check number of rows
        if ( isNaN(numberOfRows) ) {

          // toast and resume
          return $.publish( 'toast', [2, 'Error number of rows: ' + numberOfRows] );
        }

        // build rows
        for( i=0; i<numberOfRows; i++ ) {

          // clone base object
          s = clone( sowcard );

          // update sowcard data
          s.number = i;
          s.index  = i;

          // update rows array
          rows.push( s );
        }

        // insert rows -> returns promise
        return _ctx
          .getConnection()
          .then(function(connection) {

            // update rows
            return connection.updateRows( dbTables[1].name, rows );
          })
          .then(function(lastKey){

            // log
            log( 'last key', lastKey );

            // hide spinner
            $.publish( 'spinner', [false] );

            // toast
            $.publish( 'toast', [1, 'Successfully inserted ' + numberOfRows + ' sowcards in the database!'] );
          })
          .catch(function(err){

            // hide spinner
            $.publish( 'spinner', [false] );

            // toast
            $.publish( 'toast', [2, 'Error: ' + (err.message || err.toString()) + ' when inserting ' + numberOfRows + ' sowcards in the database!'] );
          });
      }, 100);
    }
  };
};
