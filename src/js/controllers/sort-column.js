'use strict';

// exports
export default ($) => {

  // return sort column handler
  return function(event) {

    // get event source. event.currentTarget reffers to tbody element
    // target = $( event.target );

    // get the element that was listening for this event
    var $target = $( event.currentTarget );

    // get row index, column index and row id
    var cIndex = $target.index();

    // get model
    var tHead = this.model.get( 'tHead' );

    // get column type
    var iClick = tHead[tHead.length - 1].th[cIndex].iClick;

    // check cell type
    if( iClick < 0 ) {

      // publish event to interested modules
      this.trigger( 'toggle-all' );

      // resume
      return;
    }

    // publish event to interested modules
    this.trigger( 'sort-table', {cIndex: cIndex, iClick: iClick} );
  };
};
