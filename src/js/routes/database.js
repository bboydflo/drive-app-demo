'use strict';

// exports route controller
export default ($, DBView, session) => {

  // return route controller
  return function() {

    // progress = true
    $.publish( 'progress', [true] );

    // pageContent
    this.topView
      .fadeOut()
      .then(() => {

        // create new db view
        var dbView = new DBView({
          lang: this.appState.lang,
          previousRoute: 'settings'
        });

        // return pageContent.renderView({
        return this.topView.renderView({
          type: 5,
          page: 'database',
          className: 'container',
          activeView: dbView
        });
      })
      .then(() => {

        // update class name
        this.topView.$( '#page-content' ).removeClass().addClass( 'container' );

        // save current page into session and persist changes in the local storage
        // session.set( 'cache', 'page', 'database' ).persist();
      })
      .catch((err) => {

        // progress = false
        $.publish( 'progress', [false] );

        // toast
        $.publish( 'toast', [2, 'DBView error: ' + err.toString()] );
      })
      .finally(() =>{
        this.topView
          .fadeIn()
          .finally(() => {

            // save current page into session and persist changes in the local storage
            session.set( 'cache', 'page', 'database' ).persist();

            // progress = false
            $.publish( 'progress', [false] );

            // hide spinner
            $.publish( 'spinner', [false] );
          });
      });
  };
};
