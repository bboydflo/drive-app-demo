import { h } from 'preact';

export default ({ hidden }) => {

  // update class name
  var hiddenClass = hidden ? 'hidden' : '';

  let toggleClass = `navbar-toggle ${ hiddenClass }`;

  return (
    <button type="button" class={toggleClass} data-toggle="collapse" data-target=".navbar-ex1-collapse">
      <span class="sr-only">Toggle navigation</span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
    </button>
  );
};
