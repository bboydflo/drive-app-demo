'use strict';

// exports
export default (Language, DialogModel, DialogView, LoadingSpinner, session) => {

  // return sync modal view
  return function(locale) {

    // labels
    var t1 = session.get( 'sp_lang', 'SP_ModalsBody4') || Language.modals.body4[locale];
    var t0 = session.get( 'sp_lang', 'SP_ModalsTitle10') || Language.modals.title10[locale];

    // define dialog model
    var model = new DialogModel({
      id: 'syncModal',
      icon: 'glyphicon-refresh',
      title: t0,
      visible: false,
      destroy: true,
      options: {
        backdrop: 'static',
        keyboard: false,
        show: false,
        xModal: false
      },
      buttons: []
    });

    // define dialog view
    var view = new DialogView({ model: model });

    // append paragraph view inside dialog view
    view.setView( '.body-component', new LoadingSpinner({ message: t1 }) );

    // android api
    return view;
  };
};
