import { h } from 'preact';

export default ({children, type = 'default', title, footer, panelClass = ''}) => {
  let pClass = `panel panel-${type} ${panelClass}`;
  return (
    <div class={pClass}>
      <div class='panel-heading'>
        {title}
      </div>
      <div class='panel-body'>
        {children}
      </div>
      <div class='panel-footer'>
        {footer}
      </div>
    </div>
  );
};
