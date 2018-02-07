import { h } from 'preact';

export default (props) => {
  if (props.visible) {
    return (
      <button class={props.class + 'btn'} data-event={props.event} role="button">
        {props.icon && <span class={'glyphicon' + props.icon}></span>} {props.title}
      </button>
    );
  }

  // do not return anything
  return null;
};