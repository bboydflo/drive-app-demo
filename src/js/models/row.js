'use strict';

//libs
import getProp from 'get-prop';

// lodash functions
import { map, extend, isArray, cloneDeep } from 'lodash';

// define button model
export default ( Backbone, DateFormat, env, utils ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(o) {
      super(o);
    }

    defaults(){
      return {
        id: 'a',
        // keep curent row number
        no: 0,
        // data array
        data: [],
        // row index
        rIndex: -1,
        // has extra fields id and dirty
        extra: 1,
        // is animal
        animal: 0,
        // isAnimal: 0,
        // is marked
        marked: 0,
        // selected
        selected: 1,
        // found
        found: 0,
        // hidden (deleted)
        hidden: 0,
        // editable defaults to true. false means
        // that no cell is editable on current row
        editable: 1,
        // row is removable (show remove column in the end)
        removable: 1,
        // row is dirty
        isDirty: 0
      };
    }

    initialize( attrs, options ) {

      // update attrs
      attrs = extend( {}, attrs, options );

      // update model
      this.set( attrs );
    }

    /**
     * remove all the unimportant fields from the row itself
     * in order to minimize the amount of data send through the wire
     * @return {object} - returns a lighten version of the row
     */
    serialize() {
      return {
        data: this.get( 'data' ),
        isDirty: this.get( 'isDirty' ),
      };
    }

    // get value by attribute
    getValueBy( attr ) {

      // get model
      var model = this.toJSON();

      // validate attribute
      if ( model.hasOwnProperty(attr) ) {

        // resume
        return model[attr];
      }

      // resume
      return false;
    }

    updateData( data ) {

      // update data
      this.set( 'data', data );

      // resume
      return this;
    }

    fillData( dLength, fields ) {
      var id     = utils.generateRowId(),
        dirty    = 0,
        data     = [],
        hasExtra = this.get( 'extra' );

      // prefill array
      for ( var i=0; i<dLength-2; i++ ) {

        // fill up data array
        data.push( '' );
      }

      // update row
      map(fields, function(field){

        // check cell value
        if ( field.newVal && hasExtra ) {

          // update dirty
          dirty = dirty | Math.pow( 2, field.col );
        }

        // update new row
        data[ field.col ] = field.newVal;
      });

      // row doesn't have extra columns [id, dirty] available
      if ( !hasExtra ) {

        // set id and dirty
        data.push( '' );
        data.push( '' );
      } else {

        // update data array with id and dirty
        data.push( id );
        data.push( dirty );
      }

      // update row
      this.set({
        id: id,
        data: data,
        isDirty: 1
      });

      // resume
      return this;
    }

    getId() {

      // return id
      return this.get( 'id' );
    }

    setId( id ) {

      // get row length
      var hasExtra = this.get( 'extra' );

      // check if row has extra
      if ( !hasExtra ) return false;

      // get data array
      var data = cloneDeep( this.get('data') );

      // update data array
      data[ data.length - 2 ] = id;

      // update row id
      this.set( 'id', id );

      // update data array
      this.set( 'data', data );

      // resume
      return this;
    }

    getDirty() {

      // get row length
      var hasExtra = this.get( 'extra' );

      // check if row has extra
      if ( !hasExtra ) return false;

      // get data
      var data = this.get( 'data' );

      // resume
      return data[ data.length - 1 ];
    }

    /**
     * make sure the row has extra (id and dirty) fields.
     * set/clear dirty. update isDirty flag accordingly
     * @param {number|undefined} dirty - new dirty value
     */
    setDirty( dirty ) {
      var isDirty = 1,
        hasExtra  = this.get( 'extra' );

      // check if row has extra
      if ( !hasExtra ) return false;

      // check dirty
      if ( !dirty ) {

        // update is dirty
        isDirty = 0;
      }

      // get data array
      var data = cloneDeep( this.get('data') );

      // prepare row to be deleted
      if ( dirty < 0 ) {

        // should set hidden flag to true
        // hidden: 1, selected: 0
        this.hideRow();

        // update dirty
        dirty = Math.pow( 2, data.length );
      }

      // update data array
      data[ data.length - 1 ] = dirty;

      // update row id
      this.set({
        'data': data,
        'isDirty': isDirty,
      });

      // resume
      return this;
    }

    clearDirty() {

      // clear dirty row
      return this.setDirty( 0 );
    }

    setValue( cIndex, newValue, setDirty ) {

      // get row length
      var currentDirty,
        data     = cloneDeep( this.get('data') ),
        hasExtra = this.get( 'extra' );

      // update data array
      data[ cIndex ] = newValue;

      // should update dirty
      if ( setDirty && hasExtra ) {

        // update current dirty
        currentDirty = this.getDirty();

        // minimal validation
        if ( typeof currentDirty !== 'number' ) return false;

        // update current dirty
        currentDirty |= Math.pow( 2, cIndex );

        // update data
        data[ data.length - 1 ] = currentDirty;

        // update row id
        this.set( 'isDirty', 1 );
      }

      // update data array
      this.set( 'data', data );

      // resume
      return this;
    }

    getValue( cIndex ) {

      // get row length
      var data = this.get( 'data' );

      // validate cIndex
      if ( typeof cIndex !== 'number' || cIndex > data.length ) {

        // resume
        return false;
      }

      // resume
      return data[ cIndex ];
    }

    getRowIndex() {

      // resume
      return this.get( 'rIndex' );
    }

    setRowIndex( rIndex ) {

      // resume
      this.set( 'rIndex', rIndex );
    }

    // set date
    updateDate( cIndex ) {

      // get date format
      var dateFormat = env.session.get( 'settings', 'dateFormat' );

      // get todays date
      // var today = Moment().format( dateFormat ).toString();
      var today = DateFormat.asString(dateFormat, new Date());

      // resume
      return this.setValue( cIndex, today, true );
    }

    /**
     * is row checked
     * @return {Boolean} [description]
     */
    isChecked() {

      // return getter
      return this.check();
    }

    /**
     * getter and setter
     * @param  {[boolean]} state - optional boolean state, used in setter mode
     * @return {[type]}       [description]
     */
    check( state ) {

      // get args
      var args = Array.prototype.slice.call( arguments );

      // check number of arguments
      if ( args.length ) {

        // set state and resume
        // return this.set( 'checked', state );
        return this.setValue( 0, state | 0, false );
      }

      // check row
      // return this.get( 'checked' );
      return this.getValue( 0 );
    }

    /**
     * uncheck row
     * @return {[type]} [description]
     */
    uncheck() {

      // uncheck row
      return this.check( 0 );
    }

    /**
     * toggle check state
     * @return {[type]} [description]
     */
    toggleCheck() {

      // toggle current check state
      this.check( 1 - this.check() );

      // resume
      return this;
    }

    /**
     * check marked/found state
     * @return {Boolean} [description]
     */
    isMarked() {

      // resume
      return this.get( 'marked' );
    }

    /**
     * getter and setter
     * @return {[type]} [description]
     */
    mark( state ) {

      // get args
      var args = Array.prototype.slice.call( arguments );

      // check number of arguments
      if ( args.length ) {

        // set state and resume
        return this.set( 'marked', state );
      }

      // check row
      return this.get( 'marked' );
    }

    /**
     * unmark row
     * @return {[type]} [description]
     */
    unmark() {

      // unmark row
      this.mark( 0 );
    }

    /**
     * toggle mark/found state
     * @return {[type]} [description]
     */
    toggleMark() {

      // toggle current state
      this.mark( 1 - this.mark() );
    }

    isHidden() {

      // get current hidden state
      return this.get( 'hidden' );
    }

    toggleHidden() {

      // toggle hidden state
      this.set( 'hidden', 1 - this.isHidden() );
    }

    hideRow() {

      // update hidden state
      this.set({ hidden: 1, selected: 0 });
    }

    // more general set handler
    updateRowBy( attr, value ) {
      var model = this.toJSON();

      // validate attribute
      if ( !model.hasOwnProperty(attr) ) return false;

      // update model
      this.set( attr, value );

      // resume
      return true;
    }

    // update row fields
    updateFields( data, bool ) {
      var _self = this,
        args  = Array.prototype.slice.call ( arguments );

      // validate number of arguments
      if ( !args.length ) return false;

      // validate column array
      if ( !isArray(data) || !data.length ) return false;

      // filter through each column
      map(data, function(field){
        var val  = getProp( field, ['val'] ),
          dirty  = getProp( field, ['dirty'] ),
          cIndex = getProp( field, ['col'] );

        // check col
        if ( cIndex == -1 ) {

          // update check
          _self.check( field.val );

          // resume
          return;
        }

        // check if new value is dirty
        if ( dirty ){

          // get update table row by id. should return updated row
          _self.setValue( cIndex, val, bool );
        }
      });

      // resume
      return this;
    }

    updateEmptyRow( layout ) {
      var data     = this.get( 'data' );

      // validate layout
      if ( !isArray(layout) ) return false;

      // map through last header
      map(layout[layout.length-1].th, function(col, idx){

        // validate new value against column type
        switch ( col.iClick ) {
        case -1:
        case 0:
          break;
        case 1:
        case 4:
        case 5:
        case 7:
        case 11:

          // update data field
          data[ idx ] = '';
          break;
        case 2:
        case 3:
        case 6:
        case 10:

          // update data field
          data[ idx ] = '';
          break;
        default:

          // update data field
          data[ idx ] = '';
          break;
        }
      });

      // check extra
      if ( this.get('extra') ) {

        // get id
        var id = this.get( 'id' );

        // set id and dirty
        data.push( id );
        data.push( 0 );
      }

      // update data
      this.set( 'data', data );

      // success
      return true;
    }
  };
};
