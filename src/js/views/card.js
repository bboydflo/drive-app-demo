'use strict';

// libs
import { assign } from 'lodash';

// exports
export default (Layout, template) => {

  // return card view
  return class V extends Layout {

    constructor(o) {
      super(assign({
        el: false,
        template: template
      }, o));
    }

    // view constructor
    initialize() {

      // listen for model changes
      this.listenTo( this.model, 'change', this.render, this );
    }

    serialize() {
      var c, r, trows, side,
        model = this.model.toJSON(),
        headersLen = model.headers.length;

      // check headers length
      if ( model.headers.length % 2 ) {
        headersLen += 1;
      }

      // divide headers len by two
      // each row has exactly 2 cols
      headersLen /= 2;

      // init vars
      side = true;
      trows = [];

      // positions
      var i, j, k = 0;

      // loop through each header to build the card info
      for(i=0; i<headersLen; i++) {

        // create empty row
        r = { row: [] };

        // loop again
        for(j=0; j<2; j++) {

          // create column
          c = {
            side: side,
            data: {
              title: model.headers[k].header || '',
              value: model.headers[k].value || '',
              color: model.headers[k].color || ''
            }
          };

          // update k
          k += 1;

          // insert column
          r.row.push(c);

          // update side
          side = !side;
        }

        // update rows
        trows.push( r );
      }

      // resume
      return { trows: trows };
    }
  };
};
