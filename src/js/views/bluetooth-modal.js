'use strict';

// exports
export default (Language, DialogModel, DialogView, SettingsView, session) => {

  // return bluetooth modal
  return (lang) => {

    // local vars
    var model, view,
      settingsView = new SettingsView({ renderMode: 2, lang: lang });

    // labels
    var t1 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[lang];

    // create dialog model
    model = new DialogModel({
      id: 'settingsModal',
      icon: 'glyphicon-cog',
      title: 'Bluetooth',
      visible: false,
      destroy: false,
      options: {
        backdrop: 'static',
        keyboard: true,
        show: false,
        xModal: true
      },
      buttons: [{
        class: 'btn-default',
        title: t1,
        visible: true,
        event: 'cancel'
      }]
    });

    // create dialog view
    view = new DialogView({ model: model });

    // append paragraph view inside dialog view
    view.setView( '.body-component', settingsView );

    // android api
    return view;
  };
};
