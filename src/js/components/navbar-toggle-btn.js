import { h } from 'preact';

export default ({ hidden }) => {

  // update class name
  // let hiddenClass = hidden ? 'hidden' : '';
  // let toggleClass = `navbar-toggle ${hiddenClass}`;

  if (hidden) return;

  return (
    <button type='button' class='navbar-toggle' data-toggle='collapse' data-target='.navbar-ex1-collapse'>
      <span class='sr-only'>Toggle navigation</span>
      <span class='icon-bar' />
      <span class='icon-bar' />
      <span class='icon-bar' />
    </button>
  );
};
