'use strict';

// exports
export default (Layout, template) => {

  // return tabs view
  return class V extends Layout {

    constructor(o) {
      super(o);

      // remove wrapper element
      this.el = false;

      // no hidden views
      this.hiddenViews = {};

      // define view template
      this.template = template; // Templates.hbs.tabs;
    }

    setVisibility( viewName, visibility ) {

      // validate viewName
      if ( typeof viewName !== 'string' || !viewName ) {

        // resume
        return;
      }

      // set view as hidden
      this.hiddenViews[viewName] = visibility;
    }

    getVisibility( viewName ) {

      // validate viewName
      if ( typeof viewName !== 'string' || !viewName ) {

        // resume
        return;
      }

      // return visibility status
      return this.hiddenViews[viewName] || false;
    }

    hideView( viewName ) {

      // validate viewName
      if ( typeof viewName !== 'string' || !viewName ) {

        // resume
        return;
      }

      // hide view
      this.$( '.' + viewName ).hide();
    }

    showView( viewName ) {

      // validate viewName
      if ( typeof viewName !== 'string' || !viewName ) {

        // resume
        return;
      }

      // hide view
      this.$( '.' + viewName ).show();
    }

    afterRender() {

      // local vars
      var v;

      // check each hidden view
      for ( v in this.hiddenViews ) {

        // check visibility status
        if ( this.getVisibility(v) ) {

          // show view
          this.showView( v );
        } else {

          // hide view
          this.hideView( v );
        }
      }
    }
  };
};
