'use strict';

// exports route controller
export default ( $, Whiteboard, session ) => {

  // export controller
  return function() {

    // create whiteboard view
    var whiteboard = new Whiteboard({ lang: this.appState.lang });

    // hide current top view
    this.topView
      .fadeOut()
      .then(() => {

        // update class name
        this.topView.$( '#page-content' ).removeClass().addClass( 'container-fluid' );

        // render view
        return this.topView
          .renderView({
            type: 8,
            page: 'whiteboard',
            activeView: whiteboard
          });
      })
      .then(() => {

        // save current page into session and persist changes in the local storage
        session.set( 'cache', 'page', 'whiteboard' ).persist();

        // fade in
        return this.topView
          .fadeIn()
          .finally(() => {

            // hide spinner
            $.publish( 'spinner', [false] );
          });
      })
      .then(() => whiteboard.refreshData())
      .catch((err) => {

        // toast
        $.publish( 'toast', [2, 'Index error: ' + err.message || err.toString()] );

        // hide spinner
        $.publish( 'spinner', [false] );
      });
  };
};
