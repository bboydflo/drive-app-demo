'use strict';

// exports route controller
export default ($, GaugesModel, Gauges, utils, session) => {

  // return route controller
  return function(endPoint) {

    // get layout
    var layout = utils.getLayoutBy( 'requestKey', endPoint );

    // prevent route when no layout available
    if ( !layout ) return $.publish( 'toast', [2, 'No layout available!'] );

    var menuType, apikeyModel, apikeyView, apikeyClass,
      connection = session.get( 'app', 'connection' );

    switch ( endPoint ) {
    case 'ASData_PGgauges':

      // css class
      apikeyClass = 'gauges';

      // gauges model
      apikeyModel = new GaugesModel({
        layout: layout,
        connection: connection
      });

      // create top view
      apikeyView = new Gauges({
        model: apikeyModel,
        lang: this.appState.lang
      });

      // update navbar menu type
      menuType = 4;
      break;
    }

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
        session.set( 'cache', 'page', endPoint ).persist();

        // progress = false
        $.publish( 'progress', [false] );

        // get data
        return apikeyView
          .getData({ endPoint: endPoint, layout: layout });
      })
      .catch((err) => {

        // progress = false
        $.publish( 'progress', [false] );

        // toast
        $.publish( 'toast', [2, endPoint + ' error: ' + err.message || err.toString()] );
      })
      .finally(() => {

        // hide spinner
        $.publish( 'spinner', [false] );
      });
  };
};
