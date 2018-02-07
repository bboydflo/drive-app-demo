import { h } from 'preact';

// define utility function to render a single header row
export default (th, isLast, hasRemovableRows) => (
  <tr>
    {th.map(head => {
      if (!head.bVisible) return;
      let sClass = head.sClass.length ? head.sClass : '';
      if (isLast && sClass) {
        sClass += ' sort';
      }
      let sTitle = head.sTitle;
      if (head.iClick === -1) {
        sClass += ' center';

        // update title
        sTitle = <i class='fa fa-square-o' aria-hidden='true' />;
      }
      return <th colspan={head.iSpan} class={sClass} style={'width :' + head.iWidth + 'px'}>{sTitle}</th>;
    })}
    {hasRemovableRows && <th colspan='1' style='width:40px' />}
  </tr>
);
