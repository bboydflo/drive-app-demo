import { h } from 'preact';

export default props => {
  let defaultPanelId = 'collapsible-panel-' + Date.now();
  let { panelGroupId = defaultPanelId, panels } = props;

  return (
    <div class='panel-group' id={panelGroupId} style='margin-bottom: 5px;'>
      {panels.map((panel, idx) => {
        let cssClass = panel.cssClass || 'panel-default';
        let titleIcon = panel.glyphicon;
        let panelId = panel.id;
        let cssCollapsed = panel.collapsed ? 'collapsed' : '';
        let panelCollapsed = panel.collapsed ? '' : 'in';
        let bodyClass = panel.bodyClass || '';
        return (
          <div class={`panel ${cssClass}`}>
            <div class='panel-heading' onClick={props.onPanelClick} data-index={idx}>
              {/* <h4 class='panel-title'></h4> */}
              <h3 class='panel-title'>
                <span class={`glyphicon glyphicon-${titleIcon}`} aria-hidden='true' />&nbsp;
                <a
                  class={`accordion-toggle ${cssCollapsed}`}
                  data-toggle='collapse'
                  data-parent={`#${panelGroupId}`}
                  href={`#${panelId}`}
                  role='button'
                  aria-expanded={!panel.collapsed}
                >
                  {panel.label}
                </a>
              </h3>
            </div>
            <div id={`${panelId}`} class={`panel-collapse collapse ${panelCollapsed}`} aria-expanded={!panel.collapsed}>
              <div class={`panel-body ${bodyClass}`}>
                {panel.body}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
