// jquery plugins
// import 'bootstrap/js/alert';
// import 'bootstrap/js/collapse';
// import 'bootstrap/js/dropdown';
// import 'bootstrap/js/tooltip';
// import 'bootstrap/js/tab';
// import 'bootstrap/js/transition';
// import 'spinner';
// import 'jEditable';
import 'jquery-caret';
import 'tiny-pub-sub';
// import 'bootstrap-datepicker';
import 'bootstrap-datepicker-new';

// do some setup and export enhanced object
export default ($) => {

  /* // added custom type -> check backup implementaion
  $.editable.addInputType('number', {

    // element : function(settings, original) {
    element: function (settings) {
      let $input = $('<input type="number" />');
      $(this).append($input);

      // in development
      if (process.env.NODE_ENV !== 'production' && settings.log) {
        console.info(settings);
      }
      return ($input);
    },
    submit: function (settings, original) {
      if (isNaN($(original).val())) {

        // alert('You must provide a number')
        console.error('you must provide a number');
        return false;
      } else {
        return true;
      }
    }
  }); */

  // attach variable to global scope
  global.$ = $;

  // return enhanced jquery object
  return $;
};
