import { h } from 'preact';

export default (props) => {

  // get last table header
  let lastHeader = props.layout.thead[props.layout.thead.length - 1].th;

  return (
    <colgroup>
      {lastHeader.map(head => {
        if (head.iWidth > 0) {
          return <col style={'width: ' + head.iWidth + 'px;'} />;
        }
      })}
      {props.hasRemovableRows && <col style={'width: 40px;'} />}
    </colgroup>
  );
};
