'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, filter, isArray, trimStart, capitalize } from 'lodash';

// singleton vars
var log;

// create worktask view by extending base view
export default ($, debug, Const, session, Language, Row, WorkTask ) => {

  // return worktask find view
  return class V extends WorkTask {

    constructor(o) {
      super(o);
    }

    // overwrite parent method
    initialize() {

      // init log
      log = debug( 'WorkTaskFind' );

      // call parent initialize
      WorkTask.prototype.initialize.call( this );

      // listen for 'find-animal' event
      this.on( 'find-animal', this.onFindAnimal.bind(this) );
    }

    /**
     * on find animal callback triggered by 'find-animal' event
     * @param  {[type]} attr  [description]
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
    onFindAnimal(attr, value) {
      var fAnimal, dialog, errMessage,
        _self   = this,
        table   = this.getView( '.main-component' ),
        counter = this.getView( '.footer-left' ),
        layout  = this.model.get( 'layout' ),
        subMode = layout.subMode;

      // update attribute (hardcode)
      attr = 'animalno';

      // labels
      var b0 = capitalize( session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[this.lang] );
      var b4 = session.get( 'sp_lang', 'SP_Toast11') || Language.toast['11'][this.lang];
      var t1 = session.get( 'sp_lang', 'SP_Toast17') || Language.toast['17'][this.lang];
      var t2 = session.get( 'sp_lang', 'SP_Toast18') || Language.toast['18'][this.lang];

      // get rows and animals
      var tRows = table.model.get( 'tRows' );
      var animals = table.model.get( 'animals' );

      // check if row already found in the collection
      if ( table.foundInColection(tRows, attr, value) ) {

        // define error message
        errMessage = 'SmartPigs ' + b0 + ': ' + t1 + ' ' +  attr + ' = ' + value + ' ' + t2;

        // toast and resume
        return $.publish( 'toast', [2, errMessage] );
      }

      // get animals
      var foundAnimals = table.foundInColection( animals, attr, value );

      // check found animals
      if ( !isArray(foundAnimals) ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs ' + b0 + ': ' + b4] );
      }

      // get animal
      fAnimal = new Row( foundAnimals[0] );

      // switch row from animals list to rows list
      fAnimal.set({ animal: 0, isDirty: 1, marked: 1 });

      // check subMode
      if ( subMode == 1 || subMode == 3 ) {

        // check if row is already checked
        if ( fAnimal.check() ) {

          // log
          log( 'row already checked! resume...' );

          // resume
          return;
        }

        // toggle check animal
        fAnimal.toggleCheck();

        // update counter
        counter.inc( 'selected' );
      }

      // append animal
      if ( !table.insertRow(fAnimal.toJSON()) ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs Error: could not insert row with ' + attr + ' : ' + value] );
      }

      // check sub mode again
      if ( subMode == 2 || subMode == 3 ) {

        // get dialog view
        dialog = table.popupRowBy( attr, value, fAnimal );

        // popup table row by attr and data
        if ( !dialog ) {

          // toast and resume
          return $.publish( 'toast', [2, 'could not find row with attr = ' + attr + ', and value = ' + value] );
        }

        // attach custom events
        dialog.on( 'visible', this.togglePopup, this );
        dialog.on( 'hidden', this.togglePopup, this );
      }

      // save it into the database as well
      this
        .saveRow(fAnimal.toJSON())
        .then(function(){

          // update counter
          counter.inc( 'total' );

          // refresh table
          return _self.refreshTable(table);
        })
        .then(function(){

          // check sub mode again
          if ( subMode == 2 || subMode == 3 ) {

            // set dialog view
            _self.setView( '.progeny-modal', dialog );

            // render dialog view
            dialog.render();
          }

          // log
          log( 'animal with attr = ' + attr + ' and value = ' + value + ' has been found and inserted into the tabel' );
        })
        .catch(this.handleError.bind(this));
    }

    /**
     * on reader result
     * @param  {[type]} event   [description]
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    onReaderResult(ev, attr, value) {
      var data, tRow, dialog, formView, errMessage,
        _self      = this,
        readerMode = Const.SINGLE_MODE,
        table      = this.getView( '.main-component' ),
        counter    = this.getView( '.footer-left' ),
        layout     = this.model.get( 'layout' ),
        subMode    = getProp( layout, ['subMode'] );

      // make sure we have table view
      if ( !table || !counter ) return;

      // get query attribute
      data = value;

      // check attr
      if ( attr == 'reader-barcode' ) {

        // update attr
        attr = 'animalno';
      }

      // check attribute for 'lfrfid'
      if ( attr == 'lfrfid' ) {

        // remove leading zeros
        value = trimStart( value, '0' );
      }

      // check reader mode
      if ( getProp(layout, 'locationOverview') ) {

        // update reader mode
        readerMode = Const.MULTI_MODE;

        // get data
        data = data.indexOf('|') < 0 ? [] : data.split('|');
      }

      // labels
      var b0 = capitalize( session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[this.lang] );
      var b4 = session.get( 'sp_lang', 'SP_Toast11') || Language.toast['11'][this.lang];
      var t1 = session.get( 'sp_lang', 'SP_Toast17') || Language.toast['17'][this.lang];
      var t2 = session.get( 'sp_lang', 'SP_Toast18') || Language.toast['18'][this.lang];

      // get rows and animals
      var tRows = table.model.get( 'tRows' );
      var animals = table.model.get( 'animals' );

      // check data
      if ( isArray(data) && data.length ) {

        // extra check (development)
        if ( readerMode == Const.MULTI_MODE ) {

          // toast and resume
          return $.publish( 'toast', [0, 'to do: implement reading multiple animals!'] );
        }

        // filter already found animals
        var animalsToSearch = filter(data, function(val) {

          // filter condition
          return !table.foundInColection( tRows, attr, val );
        });

        // check animals to search
        if ( !animalsToSearch.length ) {

          // log
          console.log('all animals already found!');

          // toast and resume
          // return $.publish( 'toast', [2, 'all animals are already found!'] );
          return;
        }

        // animals list
        var aList = [];

        // map through animals to search
        map(animalsToSearch, function(aVal) {

          // get animals
          var foundAnimals = table.foundInColection( animals, attr, aVal );

          // check found animals
          if ( !isArray(foundAnimals) ) {

            // toast and resume
            return $.publish( 'toast', [2, 'SmartPigs ' + b0 + ' : ' + b4] );
          }

          // get row
          var aFound = new Row( foundAnimals[0] );

          // switch row from animals list to rows list
          aFound.set({ animal: 0, isDirty: 1 });

          // insert row
          if ( table.insertRow(aFound.toJSON()) ) {

            // update animals array
            aList.push( aFound );
          }
        });

        // check if any animals were read
        if ( aList.length ) {

          // save animals into db
          this
            .saveRows(aList)
            .then(function(){

              // render table
              _self.render();
            })
            .catch(function(err){

              // toast
              $.publish( 'toast', [3, 'Database Error: ' + err.toString() + ' @Progeny->onReaderResult'] );
            });
        }

        // resume
        return;
      }

      // select focused element
      // var $focusedInputField = this.$('input[name="active-field"]');
      var $focusedInputField = table.$( 'input:focus' );

      // check if editableId element exists
      if ($focusedInputField.length) {

        // update input field and resume
        // this.$('input[name="active-field"]').val( value );
        $focusedInputField.val( value ).caret( value.length );

        // resume
        return;
      }

      // check popup state
      if ( this.popup ) {

        // get dialog
        dialog = this.getView( '.progeny-modal' );

        // validate dialog
        if ( !dialog ) return;

        // get form view
        formView = dialog.getView( '.body-component' );

        // validate form view
        if ( !formView ) return;

        // update dialog view form
        formView.updateField( value );

        // resume
        return;
      }

      // check if row already found in the collection
      if ( table.foundInColection(tRows, attr, value) ) {

        // define error message
        errMessage = 'SmartPigs ' + b0 + ': ' + t1 + ' ' +  attr + ' = ' + value + ' ' + t2;

        // toast and resume
        return $.publish( 'toast', [2, errMessage] );
      }

      // get animals
      var foundAnimals = table.foundInColection( animals, attr, value );

      // check found animals
      if ( !isArray(foundAnimals) ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs ' + b0 + ': ' + b4] );
      }

      // get row
      tRow = new Row( foundAnimals[0] );

      // switch row from animals list to rows list
      tRow.set({ animal: 0, isDirty: 1 });

      // check if row already is marked
      if ( tRow.mark() ) {

        // log
        log( 'row already marked! resume...' );

        // resume
        return;
      }

      // mark row
      tRow.mark( 1 );

      // check submode
      switch( subMode ) {

      // none
      case 0:

        // append animal
        if ( table.insertRow(tRow.toJSON()) < 1 ) {

          // toast
          $.publish( 'toast', [2, 'SmartPigs Error: could not append row with ' + attr + ' : ' + value] );

          // resume
          return false;
        }

        // save it into the database as well
        this
          .saveRow(tRow.toJSON())
          .then(function(){

            // update counter
            counter.inc( 'total' );

            // rerender table
            return table.render();
          })
          .catch(this.handleError.bind(this));
        break;

      // mark
      case 1:

        // toggle check animal
        tRow.toggleCheck();

        // insert animal
        if ( table.insertRow(tRow.toJSON()) < 1 ) {

          // toast
          $.publish( 'toast', [2, 'SmartPigs Error: could not append row with ' + attr + ' : ' + value] );

          // resume
          return false;
        }

        // save it into the database as well
        this
          .saveRow(tRow.toJSON())
          .then(function(){

            // log
            log( 'animal with attr = ' + attr + ' and value = ' + data + ' has been found, marked and inserted into the tabel' );

            // update counter
            counter.inc( 'total' );
            counter.inc( 'selected' );

            // rerender table
            return table.render();
          })
          .catch(this.handleError.bind(this));
        break;

      // popup
      case 2:

        // check popup state
        if ( this.popup ) {

          // log
          log( 'popup already active! resume...' );

          // resume
          return;
        }

        // append animal
        if ( table.insertRow(tRow.toJSON()) < 1 ) {

          // toast
          $.publish( 'toast', [2, 'SmartPigs Error: could not append row with ' + attr + ' : ' + value] );

          // resume
          return false;
        }

        // get dialog
        dialog = table.popupRowBy( attr, value, tRow );

        // popup table row by attr and data
        if ( !dialog ) {

          // check typeof dialog
          if ( typeof dialog == 'undefined' ) {

            // toast and resume
            return $.publish( 'toast', [2, 'could not find row with attr = ' + attr + ', and value = ' + value] );
          }

          // resume
          return;
        }

        // save it into the database as well
        this
          .saveRow(tRow.toJSON())
          .then(function(){

            // update counter
            counter.inc( 'total' );

            // log
            log( 'animal with attr = ' + attr + ' and value = ' + data + ' has been found, marked and inserted into the tabel' );

            // try to refresh main component
            return _self.refreshTable(table);
          })
          .then(function(){

            // add dialog listeners
            dialog.on( 'visible', _self.togglePopup, _self );
            dialog.on('hidden', function(){

              // update popup state
              _self.togglePopup();

              // remove dialog from the top view
              _self.removeView( '.progeny-modal' );
            });

            // set dialog view
            _self.setView( '.progeny-modal', dialog );

            // render dialog
            dialog.render();
          })
          .catch(this.handleError.bind(this));
        break;

      // mark and popup
      case 3:

        // check popup state
        if ( this.popup ) {

          // log
          log( 'popup already active! resume...' );

          // resume
          return;
        }

        // toggle check animal
        tRow.toggleCheck();

        // insert animal
        if ( table.insertRow(tRow.toJSON()) < 1 ) {

          // toast
          $.publish( 'toast', [2, 'SmartPigs Error: could not append row with ' + attr + ' : ' + value] );

          // resume
          return false;
        }

        // get dialog
        dialog = table.popupRowBy( attr, value, tRow );

        // popup table row by attr and data
        if ( !dialog ) {

          // toast and resume
          return $.publish( 'toast', [2, 'could not find row with attr = ' + attr + ', and value = ' + value] );
        }

        // save it into the database as well
        this
          .saveRow(tRow.toJSON())
          .then(function(){

            // update counter
            counter.inc( 'total' );
            counter.inc( 'selected' );

            // log
            log( 'animal with attr = ' + attr + ' and value = ' + data + ' has been found, marked and inserted into the tabel' );

            // try to refresh main component
            return _self.refreshTable(table);
          })
          .then(function(){

            // listen for dialog events
            dialog.on( 'visible', _self.togglePopup, _self );
            dialog.on('hidden', function(){

              // update popup state
              _self.togglePopup();

              // remove dialog from the top view
              _self.removeView( '.progeny-modal' );
            });

            // set dialog view
            _self.setView( '.progeny-modal', dialog );

            // render dialog
            dialog.render();
          })
          .catch(this.handleError.bind(this));
        break;
      default:

        // toast and resume
        $.publish( 'toast', [2, 'submode not defined!'] );
        break;
      }
    }
  };
};
