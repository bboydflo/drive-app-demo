'use strict';

// local vars
var lang;

// exports
export default ( $, Language, DialogModel, SelectModel, DialogView, SelectView,
  utils, session ) => {

  // return select modal handler
  return function(options) {

    // other vars
    var hbsObj = {'options': []};

    // modal vars
    var parsedOptions;

    // get current app language
    lang = session.get( 'settings', 'lang' );

    // toast message
    var t5 = session.get( 'sp_lang', 'SP_Toast5') || Language.toast['5'][lang];

    //try to parse dropdown options from JSON string
    try {

      // parse options
      // parsedOptions = JSON.parse( obj.options.replace(/""/g, '') );
      parsedOptions = JSON.parse( options.select );
    } catch ( e ) {

      // toast
      $.publish( 'toast', [ 2, t5 + ' @controllers->Progeny->selectModal()' ] );

      // resume
      return;
    }

    // create select input
    hbsObj.options = utils.createSelectInput( parsedOptions );

    // labels
    var tLabel = session.get( 'sp_lang', 'SP_ButtonChoose') || Language.button.choose[lang];
    var bLabel1 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[lang];
    var bLabel2 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[lang];

    // create dialog model
    var model = new DialogModel({
      id: options.modalName,
      icon: 'glyphicon-filter',
      title: tLabel,
      visible: false,
      destroy: true,
      options: {
        backdrop: 'static',
        keyboard: true,
        show: false,
        xModal: true
      },
      buttons: [{
        class: 'btn-default',
        title: bLabel1,
        visible: true,
        event: 'cancel'
      }, {
        class: 'btn-primary',
        title: bLabel2,
        icon: 'glyphicon-plus',
        visible: true,
        event: 'update-cell'
      }]
    });

    // instantiate new dialog view
    var view = new DialogView({ model: model });

    // select control model
    var selectModel = new SelectModel({ options: hbsObj.options });

    // create new select control view
    var selectView = new SelectView({ model: selectModel });

    // listen for add row event
    view.on('update-cell', function(){

      // local vars
      var selectView = this.getView( '.body-component' );

      // get form data
      var chosenValue = selectView.getValue();

      // validate chosen value
      if ( options.iClick === 1 || options.iClick === 5 || options.iClick === 7 ) {

        // get new value
        chosenValue = utils.toNumber( chosenValue );
      }

      // err title
      var errTitle = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[lang];

      // no value selected
      if ( chosenValue === 'select' || chosenValue === -1 ) {

        // get labels
        var errMsg1 = session.get( 'sp_lang', 'SP_Toast13') || Language.toast[13][lang];

        // trigger error on dialog view
        this.model.set('error', {
          visible: true,
          title: 'SmartPigs ' + utils.capitalizeString( errTitle ) + ': ',
          message: errMsg1
        });

        // manually rerender
        return this.updateError();
      }

      // update into the database or localStorage
      if ( chosenValue === '' ) {

        // get labels
        var errMsg2 = session.get( 'sp_lang', 'SP_Toast14') || Language.toast[14][lang];

        // trigger error on dialog view
        this.model.set('error', {
          visible: true,
          title: 'SmartPigs ' + utils.capitalizeString( errTitle ) + ': ',
          message: '<strong>' + options.colName + '</strong> ' + errMsg2
        });

        // manually rerender
        return this.updateError();
      }

      // check old value
      if ( options.oldValue === chosenValue ) {

        // hide dialog
        this.toggle();

        // resume
        return;
      }

      // trigger update
      $.publish( 'update-view', [{
        tableId: options.tableId,
        rIndex: options.rIndex,
        cIndex: options.cIndex,
        iClick: options.iClick,
        rowId: options.rowId,
        oldValue: options.oldValue,
        newValue: chosenValue
      }] );

      // toggle dialog
      this.toggle();

      // trigger add-row event further
      // _self.trigger( 'update-cell', this );
    });

    // insert form view inside dialog view
    view.setView( '.body-component', selectView );

    // return modal
    return view;
  };
};
