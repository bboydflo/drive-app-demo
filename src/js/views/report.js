'use strict';

// libs
import getProp from 'get-prop';

// exports
export default ($, Backbone, Language, PDFModel, ConnectionModel,
  ErrorModel, PDFView, ErrorView, ConnectionView, BaseView, session) => {

  // return pdf view
  return class V extends BaseView {

    constructor(o) {
      super(o);
    }

    // overwrite parent method
    initialize(opt) {

      // call parent initialize
      BaseView.prototype.initialize.call( this, opt );

      // labels
      var backLabel = session.get( 'sp_lang', 'SP_Back') || Language.button.back[this.lang];
      var u0 = session.get( 'sp_lang', 'SP_LabelsAction') || Language.labels.actions[this.lang];

      // set specific props
      this.dropdown   = true;
      this.dropLabel  = u0;
      this.actionList = [{
        icon: 'arrow-left',
        title: backLabel,
        event: 'back'
      }];
      this.divider    = false;
    }

    // before render hook
    beforeRender() {

      // error component
      if ( !this.getView('.error-component') ) {

        // create empty error model
        var errorModel = new ErrorModel();

        // set card view
        this.setView( '.error-component', new ErrorView({ model: errorModel }) );
      }

      // connection component
      if( !this.getView('.footer-right') ) {

        // define connection model
        var connectionModel = new ConnectionModel({ connection: this.isOnline() });

        // set connection view
        this.setView( '.footer-right', new ConnectionView({ model: connectionModel }) );
      }
    }

    // overwrite render
    serialize() {
      var model = this.model.toJSON();

      // resume
      return {
        title: getProp(model, ['layout', 'menuTitle'], '')
      };
    }

    afterRender() {

      // init android
      $.publish( 'init-android' );
    }

    /**
     * get data main method
     * should actually be part of the model (overwrite models view fetch method)
     * @param  {[type]} requestKey [description]
     * @return {[type]}            [description]
     */
    getData(obj) {

      // keep context refference
      var _self = this;

      // show spinner
      $.publish( 'spinner', [true] );

      // returns a promise
      return this
        .fetchData( obj )
        .then(function(arr){

          // render pdf
          return _self.renderPDF( arr[0] );
        })
        .catch( this.fetchFailed.bind(this) );
    }

    urldecode(str) {
      return decodeURIComponent((str+'').replace(/\+/g, '%20'));
    }

    /**
     * renders pdf view
     * @param  {string} fileName - part of the pdf uri resource
     */
    renderPDF(fileName) {
      var _self = this,
        layout = this.model.toJSON(),
        viewportHeight = $( window ).height() - 130;

      // get url details
      var clientUrl = session.get( 'url' );

      // build resource link
      var resourceLink = clientUrl.protocol + '//' + clientUrl.host + ':' + clientUrl.port + '/' + fileName;

      // update menu title
      layout.menuTitle = this.urldecode( fileName );

      // update progeny model
      this.model.set( 'layout', layout );

      // define pdf model
      var pdfModel = new PDFModel({
        fileName: fileName,
        viewHeight: viewportHeight,
        resourceLink: resourceLink
      });

      // create pdf view
      var pdfView = new PDFView({ model: pdfModel });

      // create table view
      this.setView( '.main-component', pdfView );

      // returns a promise
      return new Promise(function(resolve){

        // render
        _self
          .render()
          .promise()
          .done(function(){

            // resolve promise
            resolve();
          });
      });
    }

    // on back handler
    onBack() {

      // get previous route
      var previousRoute = this.model.get( 'previousRoute' ) || 'mainmenu';

      // navigate
      Backbone.history.navigate( previousRoute, { trigger: true } );
    }
  };
};
