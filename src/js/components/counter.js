import { h } from 'preact';

// pure functional stateless preact component
export default (props) => {

  // define static values
  let title = props.title || 'Total';
  let selected = props.selected;
  let visible = props.visible;

  return (
    <span>
      {title + ': '}
      <strong>{(selected ? ' / ' : '') + visible}</strong>
    </span>
  );
};
