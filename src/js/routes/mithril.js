'use strict';

// libs
import m from 'mithril';

// exports route controller
export default ($, MithrilView) => {

  // return mithril route controller
  return function(hash) {

    // log
    console.log(hash);

    // progress = true
    $.publish('progress', [true]);

    this.topView
      .fadeOut()
      .then(() => {

        // render mithril view
        m.mount(document.getElementById('page-content'), MithrilView);
        /*
        return this.topView.renderView({
          type: 4,
          page: 'progeny',
          activeView: reportView
        });
        */
        return true;
      })
      .then(() => {

        // update class name
        this.topView
          .$('#page-content')
          .removeClass()
          .addClass('container-fluid');

        // fade page in
        return this.topView.fadeIn();
      })
      .catch(err => {

        // progress = false
        $.publish('progress', [false]);

        // toast
        $.publish('toast', [2,' error: ' + err.toString()]);
      })
      .finally(() => {

        // hide spinner
        $.publish('spinner', [false]);
      });
  };
};
