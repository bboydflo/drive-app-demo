'use strict';

// libs
import getProp from 'get-prop';

// exports route controller
export default ($, Base64, Backbone, ProgenyModel, ReportView, session) => {

  // return pdf rouyte controller
  return function(hash) {
    var fragment;

    try {

      // get fragment
      fragment = JSON.parse( Base64.decode(hash) );
    } catch(e) {

      // toast
      $.publish( 'toast', [2, 'SmartPigs navigation error! (Error: ' + e.message + ')'] );

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );

      // resume
      return;
    }

    // todo -> validate fragment object
    // fragment is now an object and has 'rowId' and 'requestKey' attributes

    // get data
    var rowId = getProp( fragment, ['rowId'], -1 );
    var requestKey = getProp( fragment, ['requestKey'], '' );

    // validate requestKey
    if ( !requestKey.length || rowId < 0 ) {

      // toast
      $.publish( 'toast', [2, 'SmartPigs requestKey error!'] );

      // resume
      return;
    }

    // define endpoint
    var endPoint = requestKey + '/' + rowId;

    // get current connection state
    var connection = session.get( 'app', 'connection' );

    // define layout
    var layout = {
      requestKey: endPoint,
      previousRoute: 'p/' + requestKey
    };

    // create progeny model
    var dynamicModel = new ProgenyModel({
      layout: layout,
      connection: connection,
      dataType: 'pdf',
      previousRoute: 'p/' + requestKey
    });

    // view options
    var viewOpt = {
      model: dynamicModel,
      lang: this.appState.lang
    };

    // get dynamic view
    var reportView = new ReportView( viewOpt );

    // progress = true
    $.publish( 'progress', [true] );

    this.topView
      .fadeOut()
      .then(() => {
        return this.topView.renderView({
          type: 4,
          page: 'progeny',
          activeView: reportView
        });
      })
      .then(() => {

        // update class name
        this.topView.$( '#page-content' ).removeClass().addClass( 'container-fluid' );

        // save current page into session
        // session.set( 'cache', 'page', 'pdf/' + hash ).persist();

        // fade page in
        return this.topView.fadeIn();
      })
      .then(() => {

        // save current page into session
        session.set( 'cache', 'page', 'pdf/' + hash ).persist();

        // progress = false
        // $.publish( 'progress', [false] );

        // get data
        return reportView.getData({ layout: layout });
      })
      .catch((err) => {

        // progress = false
        $.publish( 'progress', [false] );

        // toast
        $.publish( 'toast', [2, endPoint + ' error: ' + err.toString()] );

        // hide spinner
        $.publish( 'spinner', [false] );
      })
      .finally(() => {

        // hide spinner
        $.publish( 'spinner', [false] );
      });
  };
};
