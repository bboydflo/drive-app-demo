'use strict';

// exports
// export default (Layout, Language, session, locale) => {
export default (Layout) => {

  return class V extends Layout {

    constructor(options) {
      super(options);

      // labels
      // var t3 = session.get( 'sp_lang', 'SP_ModalsBody5') || Language.modals.body5[locale];

      // define img path
      var imgPath = 'dist/images/ajax-loader.gif';

      // check modernizr
      if ( Modernizr.smartpigs || Modernizr.crosswalk ) {

        // update imgPath
        imgPath = 'file:///android_asset/android/images/ajax-loader.gif';
      }

      // define message
      let message = this.message;

      // remove wrapper div
      this.el = false;

      // define view template
      this.template = () => {
        return `<div class="text-center">
          <img src="${imgPath}" height="16" width="16" class="icon" />
          <h4> ${message} </h4>
        </div>`;
      };
      // <h4> ${t3} </h4>
    }
  };
};
