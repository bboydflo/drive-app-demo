'use strict';

// lodash functions
import { map, extend, cloneDeep } from 'lodash';

// empty card
let emptyCard = {
  index: 0,
  number: '',
  group: '',
  breed: '',
  age: 0,
  idx: 0,
  remark: '',
  location: '',
  detained: '',
  uhfrfid: '',
  lfrfid: '',
  isDirty: 0,
  deleteEventId: -1,
  entry: { tr: [] },
  renaming: { tr: [] },
  litters: { tr: [] },
  medicine: { tr: [] },
  transfer: { tr: [] },
  condition: { tr: [] },
  tagging: { tr: [] },
  deadpiglet: { tr: [] },
  piglettransfer: { tr: [] },
  dnasample: { tr: [] },
  skippedinbox: { tr: [] },
  exit: { tr: [] },
  keyfigures: { tr: [] },
  headers: [],

  // added layout name
  layout: ''
};

// define basecard model factory
export default ( Backbone ) => {

  // return card model
  return class Model extends Backbone.Model {
    constructor(o) {
      super(o);
    }

    defaults() {
      return {
        data:       emptyCard,  // card data
        layout:     {},         // card layout
        isDirty:    0,          // top view dirty flag
        cardType:   0,          // card type. sow/breeding card
        viewType:   1,          // litters view type [history view, full sowcard view
        assignTab:  0,          // assign tab state (disabled by default)
        activeLit:  0,          // active litter number
        activeView: 'thead',    // default active tab,
        connection: 1,          // connection
        deleteEventId: -1,
        previousRoute: ''       // if sowcard opened from within an action list keep track of this action list
      };
    }

    updateData(data) {

      // current data
      this.set( 'data', data );
    }

    updateCard(key, value) {

      // current data
      var data = cloneDeep( this.get('data') );

      // update data
      data[ key ] = value;

      // update data
      this.updateData( data );
    }

    insertCardRow(name, tRow) {

      // current data
      var data = cloneDeep( this.get('data') );

      // insert row
      data[ name ].tr.push( tRow );

      // update data
      this.updateData( data );
    }

    updateCardRow(name, tRow) {

      // current data
      var data = cloneDeep( this.get('data') );

      // loop through card rows
      map(data[name].tr, function( row ){

        // update specific row
        if ( row.id == tRow.id ) {

          // overwrite table row
          extend( row, tRow );
        }
      });

      // update data
      this.updateData( data );
    }

    updateCardRowByIndex(name, tRow, index) {

      // current data
      var data = cloneDeep( this.get('data') );

      // loop through card rows
      map(data[name].tr, function( row, idx ){

        // update specific row
        if ( index == idx ) {

          // overwrite table row
          extend( row, tRow );
        }
      });

      // update data
      this.updateData( data );
    }
  };
};
