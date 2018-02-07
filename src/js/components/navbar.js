import _ from 'underscore';
import { h } from 'preact';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';

export default (props) => {
  let hidden = false;
  const noop = () => {};

  let {
    theme = 'default',
    position = 'top',
    brand,
    items = [],
    menuType,
    toggleBtnVisible = false,
    onNavbarClick = noop
  } = props;

  // log
  // console.log(items);

  // reduce number of items in the list
  let noItems = _.reduce(items, (num, item) => {

    // update counter
    num += (item.enabled ? 1 : 0);

    // return number of enabled items
    return num;
  }, 0);

  if (typeof menuType === 'undefined') {
    return <div>No menu defined!</div>;
  }

  // define tooltip default placement
  let tooltipPos = 'bottom';

  if (position === tooltipPos) {
    tooltipPos = 'top';
  }

  if (menuType) {
    return (
      <nav class={`navbar navbar-${theme} navbar-fixed-${position}`} id='toggleNav' role='navigation'>
        <div class='navbar-header'>
          <ul class='toolbar-group-xs visible-xs'>
            {items.map(item => {
              if (!item.enabled) return;
              const tooltip = (
                <Tooltip id={item.id}>{item.label.capitalizeFirstLetter()}</Tooltip>
              );
              let spanStyles = item.color ? `color: ${item.color}` : null;
              return (
                <li
                  class='toolbar-item'
                  data-toggle='tooltip'
                  data-event={item.event}
                  style={`width: ${100 / noItems}%`}
                  onClick={onNavbarClick}
                >
                  <OverlayTrigger placement={tooltipPos} overlay={tooltip}>
                    <button type='button' class='btn-toolbar-xs'>
                      <span style={spanStyles}>
                        <span class={item.icon} /> {item.showLabel && item.label.capitalizeFirstLetter()}
                      </span>
                    </button>
                  </OverlayTrigger>
                </li>
              );
            })}
          </ul>
        </div>
        <span class='hidden-xs'>
          {brand}
        </span>
        <div class='collapse navbar-collapse navbar-ex1-collapse'>
          <ul class='nav navbar-nav navbar-right'>
            <div class='toolbar-group'>
              {items.map(item => {
                if (!item.enabled) return;
                return (
                  <button type='button' class='btn-toolbar-sp' data-event={item.event} onClick={props.onNavbarClick}>
                    <span style={`color: ${item.color}`}>
                      <span class={item.icon} /> {item.label.capitalizeFirstLetter()}
                    </span>
                  </button>
                );
              })}
            </div>
          </ul>
        </div>
      </nav>
    );
  }

  return (
    <nav class={`navbar navbar-${theme} navbar-fixed-${position}`} id='toggleNav' role='navigation'>
      <div class='navbar-header'>
        {toggleBtnVisible && <button type='button' class='navbar-toggle' data-toggle='collapse' data-target='.navbar-ex1-collapse'>
          <span class='sr-only'>Toggle navigation</span>
          <span class='icon-bar' />
          <span class='icon-bar' />
          <span class='icon-bar' />
        </button>
        }
        {brand}
      </div>
      <div class='collapse navbar-collapse navbar-ex1-collapse'>
        {hidden && <ul class='nav navbar-nav navbar-right'>
          {items.map(item => (
            <li class='menu-item'>
              <a href='#' class='event-item' id={item.id} onClick={onNavbarClick}>
                <span class={item.glyphicon} /> {item.label}
              </a>
            </li>
          ))}
        </ul>
        }
      </div>
    </nav>
  );
};
