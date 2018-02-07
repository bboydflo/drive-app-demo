'use strict';

// exports
export default (Language, DialogModel, DialogView, LoadingSpinner, session) => {

  return (locale) => {

    // labels
    var t3 = session.get( 'sp_lang', 'SP_ModalsBody5') || Language.modals.body5[locale];
    var t4 = session.get( 'sp_lang', 'SP_ModalsTitle6') || Language.modals.title6[locale];

    // define dialog model
    var model = new DialogModel({id: 'downloadData',
      icon: 'glyphicon-save',
      title: t4,
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
    view.setView( '.body-component', new LoadingSpinner({ message: t3}) );

    // android api
    return view;
  };
};
