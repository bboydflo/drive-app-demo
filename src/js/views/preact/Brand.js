import { h } from 'preact';

export default ({ version }) => {
  return (
    <p class="navbar-text">SmartPigs <code>{ version }</code></p>
  );
};
