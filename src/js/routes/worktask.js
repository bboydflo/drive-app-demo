'use strict';

// exports route controller
export default ($, Backbone, ProgenyModel, WorkTaskList, WorkTaskFind, utils, session) => {

  // return route controller
  return function(requestKey) {

    // get layout
    var layout = utils.getLayoutBy( 'requestKey', requestKey );

    // prevent route when no layout available
    if ( !layout ) {

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );

      // toast and resume
      return $.publish( 'toast', [2, 'No layout available!'] );
    }

    // get current connection state
    var connection = session.get( 'app', 'connection' );

    // css class
    var apikeyClass = 'progeny';

    // work task model
    var apikeyModel = new ProgenyModel({
      connection: connection,
      layout: layout,
      previousRoute: 'mainmenu'
    });

    // api options
    var viewOpt = {
      model: apikeyModel,
      lang: this.appState.lang,
      sowcardKey: 'ASData_SowCard'
    };

    /**
     * get top view
     * mainMode = 1 -> find mode
     * mainMode = 0 -> list mode
     */
    var apikeyView = layout.mainMode ? new WorkTaskFind( viewOpt ) : new WorkTaskList( viewOpt );

    // update menu type
    var menuType = 4;

    // progress = true
    $.publish( 'progress', [true] );

    this.topView
      .fadeOut()
      .then(() => {

        // render view async
        return this.topView.renderView({
          type: menuType,
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
        session.set( 'cache', 'page', 'w/' + requestKey ).persist();

        // progress = false
        $.publish( 'progress', [false] );

        // get data
        return apikeyView.getData({ endPoint: requestKey, layout: layout });
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
