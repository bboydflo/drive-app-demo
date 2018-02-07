import { h } from 'preact';

export default (props) => {

  // get connection value
  let { connection } = props;

  // span class
  let spanCls;

  if (props.type && props.type === 0) {

    // define span class
    spanCls = connection ? 'text-success' : 'text-error';

    // define span label
    let spanLbl = connection ? 'Online' : 'Offline';

    return (
      <span class={spanCls}>
        <strong>{spanLbl}</strong>
      </span>
    );
  }

  // define span class
  spanCls = 'fa ' + (connection ? 'fa-signal text-info' : 'fa-plane text-error');

  return <i class={spanCls} aria-hidden='true' />;
};
