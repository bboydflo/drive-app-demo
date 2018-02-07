'use strict';

// exports
export default (Language, DialogModel, DialogView, ParagraphView, session) => {

  return (lang) => {

    // labels
    var u7 = session.get( 'sp_lang', 'SP_MenubarLogout') || Language.menubar.logout[lang];
    var v8 = session.get( 'sp_lang', 'SP_ModalsBody6') || Language.modals.body6[lang];
    var u4 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[lang];
    var u5 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[lang];

    // create dialog model
    var model = new DialogModel({
      id: 'logoutModal',
      icon: 'glyphicon-log-out',
      title: u7,
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
        title: u4,
        visible: true,
        event: 'cancel'
      }, {
        class: 'btn-primary',
        title: u5,
        icon: 'glyphicon-log-out',
        visible: true,
        event: 'logout'
      }]
    });

    // create dialog view
    var view = new DialogView({ model: model });

    // append paragraph view inside dialog view
    view.setView( '.body-component', new ParagraphView({ message: v8 }) );

    // android api
    return view;
  };
};
