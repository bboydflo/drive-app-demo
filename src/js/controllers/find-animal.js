import $ from 'jquery';

// define find animal controller
export default function (event) {

  // get input
  var $input = this.$('input.animal-serial');

  // local vars
  var value = $.trim($input.val());

  // validate value
  if (!value) return;

  // default search attribute
  var attr = value.length < 6 ? 'serialno' : 'animalno';

  // get keycode (cross browser)
  var keycode = event.keyCode ? event.keyCode : event.which;

  // on submit form or click search
  if ((event.type === 'keyup' && keycode === 13) || event.type === 'click') {

    // trigger find-animal on the current view
    this.trigger('find-animal', attr, value);

    // reset input value
    $input.val('');
  }
}
