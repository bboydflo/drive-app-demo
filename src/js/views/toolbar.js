'use strict';

// lodash functions
import { map, filter, assign } from 'lodash';

// module vars
var locale;

// exports
export default ( $, Language, tpl, Layout, session ) => {

  // return toolbar view
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // remove wrapper parent div element
        el: false,

        // define view template
        template: tpl,

        // defined events
        events: {
          'click .btn': 'clickEvent'
        }
      }, o));
    }

    initialize() {

      // initialize lang
      locale = session.get( 'settings', 'lang' );
    }

    serialize() {

      // labels
      var b1 = session.get( 'sp_lang', 'SP_LabelsMarking') || Language.labels.marking[locale];

      var collection = this.collection.toJSON(),
        btns       = {
          checkLabel: b1,
          buttons: []
        };

      // map through collection
      map(collection, function(btn) {
        btns.buttons.push(btn);
      });

      // update checkmark
      btns.checkmark = this.checkmark || false;
      btns.checkState = this.checkState || false;

      // resume
      return btns;
    }

    clickEvent( ev ) {

      // prevent default event
      ev.preventDefault();

      // local vars
      var eventName = $( ev.currentTarget ).data( 'event' );

      // check if valid event name
      if ( eventName ) {

        // publish event
        this.trigger( eventName );
      }
    }

    addButton( newBtn ) {

      // get toolbar collection
      var btns = filter(this.collection.toJSON(), function(btn){

        // filter criteria
        return newBtn.event == btn.event;
      });

      // button already found in the toolbar
      if ( btns.length ) return;

      // append the new button to the toolbar
      this.collection.add( newBtn );
    }

    /**
     * removes the button by its event name from the collection
     * @param  { String } eventName - button event name to be removed
     */
    removeButton( eventName ) {

      // update collection
      var collection = this.collection.filter(function(btn){

        // filter condition
        return eventName == btn.get( 'event' ) ? false : true;
      });

      // update collection
      this.collection.set( collection );
    }

    // removes last button from the toolbar collection
    removeLastButton() {

      // update toolbar collection
      this.collection.pop();
    }
  };
};
