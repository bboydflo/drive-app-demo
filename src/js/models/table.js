'use strict';

// export table model
export default ( Backbone ) => {

  // returns backbone model
  return class Model extends Backbone.Model {
    constructor(options) {
      super(options);
    }

    defaults() {
      return {
        tId: '',                    // view table dom id
        tHead: [],                  // table header
        tRows: [],                  // table rows
        animals: [],                // table animals
        properties: {},             // computed table properties
        tWidth: 0,

        tTitle: '',                 // view title (probably belongs to an upper component)
        tDirty: false,              // table view dirty state (computed property)
        tExtra: true,               // table view contains extra fields (id and dirty)
        tDate: true,                // when add row, insert todays date by default
        tDateFormat: '',            // date format
        tRemovable: 1,              // new added row should be removable by default
        tEditable: 1,               // new added row should be editable by default
        tBatch: false,              // has batch support
        tCheck: false,              // has fake checkmark support
        tEdit: false,               // if true on click -> edit clicked row
        toggleAll: false,           // toggle all visible rows unchecked
        sortType: false,            // ascending/descending
        sortIndex: -1,              // column index
        hasScroll: false,           // has scroll or not
        scrollTop: 0,               // scroll to top
        scrollHeight: 0,            // scrolling height
        visibleThreshold: 0,        // visible row threshold
        tIndex: 0,                  // top index
        bIndex: 0,                  // bottom index
        rowBeforeHeight: 0,         // fake top rows height
        rowAfterHeight: 0,          // fake bottom rows height,
        cRoute: ''                  // current route
      };
    }

    initialize( attrs ) {

      // if any attributes are passed
      if ( !attrs ) return;

      // update properties
      this.updateProperties( attrs );

      // listen for model change
      // this.on( 'change:tRows', function( args ) {
      this.on( 'change', function() {

        // update properties
        this.updateProperties( this.toJSON() );

        // log
        // console.log( 'something has changed' );
        // console.log( args );
      });
    }

    updateProperties( attrs ) {
      var prop = { rowsLength: 0 };

      // check if tHead
      if ( attrs.hasOwnProperty( 'tHead' ) && attrs.tHead.length ) {

        // compute properties
        prop.numberOfHeaders = attrs.tHead.length;
        prop.lastHeaderIdx = attrs.tHead.length - 1;

        // check if th and th.length
        if ( attrs.tHead[0].hasOwnProperty( 'th' ) && attrs.tHead[0].th.length ) {

          // compute mode properties
          prop.firstHeaderLength = attrs.tHead[0].th.length;
          prop.lastHeaderLength = attrs.tHead[prop.numberOfHeaders - 1].th.length;
        }
      }

      // compute total rows length
      if ( attrs.hasOwnProperty( 'tRows' ) ) {
        prop.rowsLength = attrs.tRows.length;
      }

      // update properties object
      this.set( 'properties', prop );
    }
  };
};
