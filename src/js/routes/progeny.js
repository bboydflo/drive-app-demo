'use strict';

// exports route controller
export default ($, Backbone, ProgenyModel, ProgenyView, utils, session) => {

  // return progeny route controller
  return function(requestKey) {

    // helper function
    var scrollToBottom = () => {
      setTimeout(() => {

        // scroll to bottom
        window.scrollTo( 0, document.body.scrollHeight );
      }, 100);
    };

    // get layout
    var layout = utils.getLayoutBy( 'requestKey', requestKey );

    // prevent route when no layout available
    if ( !layout ) {

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );

      // toast and resume
      return $.publish( 'toast', [2, 'No layout available!'] );
    }

    // var lang = _ctx.topView.getState( 'lang' ),
    var connection = session.get( 'app', 'connection' );

    // define class
    var apikeyClass = 'progeny';

    // create progeny model
    var apikeyModel = new ProgenyModel({
      layout,
      connection,
      previousRoute: 'mainmenu'
    });

    // create progeny view
    var apikeyView = new ProgenyView({
      model: apikeyModel,
      lang: this.appState.lang,
    });

    // progress = true
    $.publish( 'progress', [true] );

    this.topView
      .fadeOut()
      .then(() => {

        // render view async
        return this.topView.renderView({
          type: 4,
          page: apikeyClass,
          activeView: apikeyView
        });
      })
      .then(() => {

        // update class name
        this.topView.$( '#page-content' ).removeClass().addClass( 'container-fluid' );

        // fade page in
        return this.topView.fadeIn();
      })
      .then(() => {

        // save current page into session
        session.set( 'cache', 'page', 'p/' + requestKey ).persist();

        // progress = false
        // $.publish( 'progress', [false] );

        // get data
        return apikeyView.getData({ endPoint: requestKey, layout: layout });
      })
      .then(() => {

        // scroll
        scrollToBottom();

        // on orientation
        $( window ).on( 'orientationchange', scrollToBottom );
      })
      .catch((err) => {

        // progress = false
        $.publish( 'progress', [false] );

        // toast
        $.publish( 'toast', [2, requestKey + ' error: ' + err.message || err.toString()] );

        // hide spinner
        $.publish( 'spinner', [false] );
      })
      .finally(() => {

        // hide spinner
        $.publish( 'spinner', [false] );
      });
  };
};
