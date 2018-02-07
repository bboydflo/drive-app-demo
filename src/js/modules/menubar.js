import hasProp from 'hasprop';
import isPojo from 'is-pojo';

let menubar;

// exports singleton pattern
// http://viralpatel.net/blogs/javascript-singleton-design-pattern/
export default (v, m, opt) => {

  // cache view
  let view;

  class MenubarModule {
    constructor (MenubarView, MenubarModel, options) {

      // if called with the right constructor
      if (!(this instanceof MenubarModule)) {
        throw new TypeError('MenubarModule not called as a constructor!');
      }

      // minimal check
      if (!isPojo(options)) {
        throw new Error('Menubar called with wrong parameters!');
      }

      // create model
      let model = new MenubarModel(options);

      // create menubar view
      view = new MenubarView({ model, lang: options.lang });

      // resume
      return this;
    }

    getView () {

      // resume
      return view;
    }

    updateModel (options) {

      // simple validation
      if (isPojo(options) && view) {

        // update model
        view.model.set(options);

        // force update
        view.update();
      }

      // check if updating connection
      if (hasProp(options, ['connection'])) {

        // update android status as well
        // $.publish( 'controls', ['connection', options.connection == 1 ? true : false] );
        view.updateConnection(options.connection === 1);
      }
    }

    subscribe (ev, cb) {

      // add single event listeners
      view.on(ev, cb);
    }

    unsubscribe (ev) {

      // check result type
      switch (typeof ev) {
        case 'undefined':

          // stop listening for all events
          view.off();
          break;
        case 'string':
          if (ev) {

            // stop listening for custom event
            view.off(ev);
          } else {

            // stop listening for all events
            view.off();
          }
          break;
        default:
          break;
      }
    }

    update (type, lang) {

      // force update
      view.update(type, lang);
    }

    trigger (event, args) {

      /**
       * TODO
       * better implementation of trigger function in order
       * to better pass event arguments
       */

      // trigger event
      view.trigger(event, args);
    }
  }

  // check menubar
  if (menubar) return menubar;

  // get menu api (pass view, model and options)
  menubar = new MenubarModule(v, m, opt);

  // resume
  return menubar;
};
