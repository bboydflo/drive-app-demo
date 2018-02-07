import { h } from 'preact';

export default (props) => {
  if (props.visible) {
    return (
      <button class={'btn ' + props.class} data-event={props.event} role='button' onClick={props.onClick}>
        {props.icon && <span class={'glyphicon glyphicon-' + props.icon} />} {props.title}
      </button>
    );
  }

  // do not return anything
  return null;
};
