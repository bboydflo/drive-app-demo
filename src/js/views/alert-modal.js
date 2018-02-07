'use strict';

// libs
import getProp from 'get-prop';

// exports
export default ( DialogModel, DialogView, ParagraphView ) => {

  // return alert modal
  return (options) => {

    // check xModal options
    var xModal = getProp( options, ['xModal'], true );

    // create dialog model
    var model = new DialogModel({
      id: 'logoutModal',
      icon: 'glyphicon-warning-sign',
      title: options.title,
      visible: false,
      destroy: true,
      options: {
        backdrop: 'static',
        keyboard: true,
        show: false,
        xModal: xModal
      },
      buttons: [{
        class: 'btn-default',
        title: options.cancel,
        visible: options.cancelVisible,
        event: 'cancel'
      }, {
        class: 'btn-primary',
        title: options.confirm,
        visible: options.confirmVisible,
        event: 'confirm',
        href: options.href || ''
      }]
    });

    // create dialog view
    var view = new DialogView({ model: model });

    // append paragraph view inside dialog view
    view.setView( '.body-component', new ParagraphView({message: options.message}) );

    // android api
    return view;
  };
};
