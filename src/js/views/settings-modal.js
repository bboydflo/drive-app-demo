'use strict';

// exports
export default (Backbone, Language, DialogModel, DialogView, SettingsView, session) => {

  // return settings modal
  return (lang) => {

    // labels
    var sTitle = session.get( 'sp_lang', 'SP_SettingsModalTitle') || Language.settingsModal.title[lang];
    var bLabel2 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[lang];

    // create dialog model
    var model = new DialogModel({
      id: 'settingsModal',
      icon: 'glyphicon-cog',
      title: sTitle,
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
        title: bLabel2,
        visible: true,
        event: 'cancel'
      }]
    });

    // create dialog view
    var view = new DialogView({
      model: model,
      lang: lang
    });

    // listen for 'language-change' event
    view.on('language-change', function( lang ){

      // get title again
      var sTitle = session.get( 'sp_lang', 'SP_SettingsModalTitle') || Language.settingsModal.title[lang];

      // update dialog title
      this.model.set( 'title', sTitle );
    });

    // create settings view
    var settingsView = new SettingsView({ lang: lang, renderMode: 1 });

    // listen for 'language-change' event
    settingsView.on('test-db', function(){

      // toggle dialog
      view.hide(function(){

        // navigate
        Backbone.history.navigate( 'database', { trigger: true } );
      });
    });

    // append paragraph view inside dialog view
    view.setView( '.body-component', settingsView );

    // android api
    return view;
  };
};
