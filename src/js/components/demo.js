import _ from 'underscore';
import fecha from 'fecha';
import { h, Component } from 'preact';
import Navbar from './navbar';
import Panel from './default-panel';
import Counter from './counter';
import ErrorView from './error';
import Connection from './connection';
import SpreadWrapper from './spread-wrapper';

import rows from '../data/actual/worktask_lite';
import layout from '../data/fake-worktask-layout';

import Language from '../modules/lang';
import Const from '../modules/constants';

// date libraries
// import moment from 'moment';
// https://github.com/nomiddlename/date-format (formatt date with custom masks)
// https://github.com/felixge/node-dateformat

const getRandomNumber = (m, precision) => {
  let p = precision || 0.000001; // desired precision
  let min = m || -1 + p;
  let max = 100 - p;
  return Math.floor(Math.random() * (max - min) + min);
};

/**
 * Returns a random integer between min and max
 * Using Math.round() will give you a non-uniform distribution!
 */
// const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function convertDate (value, srcFormat, destFormat) {
  // TODO: make sure to correctly parse the date string
  // using the correct supported fecha format
  // check fecha masks
  let d = fecha.parse(value, srcFormat.toUpperCase());
  // console.log(`initial value = ${value},  src format: ${srcFormat} -> value = ${d}`);
  let df = fecha.format(d, destFormat.toUpperCase());
  // console.log(`destination format: ${destFormat} -> value = ${df}`);
  return df;
}

export default (session) => class DemoView extends Component {

  // define some internal state
  state = {
    datepicker: {
      show: false,
      value: ''
    },
    lang: session.get('settings', 'lang'),
    editable: [],
    timerDelay: 100,
    rows
  };

  render (props, state) {

    // define footer
    let panelFooter = (
      <div class='clearifx'>
        <span class='footer-left'>
          <Counter title='Cntr' selected={0} visible={rows.tr.length} />
        </span>
        <span class='footer-right pull-right'>
          <Connection connection />
        </span>
      </div>
    );

    // get current lang
    let { lang } = state;

    let menuDetails = this.getMenuDetails(1, lang);

    // has at least one removable row
    let hasRemovableRows = _.reduce(rows, (res, r) => res || r.removable, false);

    // compute table width
    let tWidth = _.reduce(layout.thead[layout.thead.length - 1].th, (sum, value) => sum + value.iWidth, hasRemovableRows ? 40 : 0);

    // viewport height
    let viewportHeight = session.get('device', 'height');

    // calculate spread remaining height
    let spreadHeight = viewportHeight - (Const.NAV_HEIGHT + Const.PANEL_TITLE__HEIGHT + (layout.thead.length - 1) * Const.ROW_HEIGHT + Const.PANEL_FOOTER_HEIGHT + Const.SCROLLBAR_HEIGHT);

    console.log(spreadHeight);

    // adjust scroll height
    spreadHeight = spreadHeight - spreadHeight % (Const.ROW_HEIGHT - 1);

    // console.log(spreadHeight);

    // update has scroll state
    let hasScroll = rows.tr.length * Const.ROW_HEIGHT > spreadHeight;

    // update scroll height measurement unit
    let scrollHeight = hasScroll ? spreadHeight + 'px' : '100%';

    // define
    let wrapperStyles = 'width: ' + tWidth + 'px';
    let bodyStyles = 'width: ' + (tWidth + 20) + 'px; overflow-x: hidden;';

    // check scrolling
    if (hasScroll) {
      bodyStyles += ' height: ' + scrollHeight + '; overflow-y: scroll;';
    }

    return (
      <div class='progeny'>
        <Navbar details={menuDetails} onNavbarClick={this.onNavbarClick} />
        <div id='page-content' class='container-fluid'>
          <Panel title={'Hauskov'} footer={panelFooter} panelClass='panel-progeny' >
            {props.hasError && <ErrorView />}
            {props.findAnimal &&
              <div class='find-animal-component'>
                <div class='input-group'>
                  <span class='input-group-btn'>
                    <button class='btn btn-default animal-serial' type='button' data-event='find-animal'>
                      <span class='glyphicon glyphicon-search' /> {props.placeholder}
                    </button>
                  </span>
                  <input type='text' class='form-control animal-serial' placeholder={props.placeholder} />
                </div>
              </div>
            }
            <SpreadWrapper
              data={rows.tr}
              layout={layout}
              tWidth={tWidth}
              wrapperStyles={wrapperStyles}
              bodyStyles={bodyStyles}
              hasRemovableRows={hasRemovableRows}
              editable={state.editable}
              onClickCell={this.onClickCell}
              cellRef={el => {
                this.$cellElement = el;
              }}
              {...props}
            />
          </Panel>
        </div>
      </div>
    );
  }

  getMenuDetails = (page = 0, lang) => {
    let brand;
    let menuType = 1;
    let toggleBtnVisible = false;
    let settingsLabel = Language.settingsModal.title[lang];
    let menuItems = [{
      enabled: true,
      id: 'menu-settings',
      data: false,
      label: settingsLabel,
      visible: true,
      glyphicon: 'glyphicon glyphicon-cog'
    }];

    switch (page) {
      case 0:
      case 7:
        menuType = 0;
        toggleBtnVisible = true;
        brand = <p class='navbar-text'>SmartPigs <code> {session.get('app', 'version')}</code></p>;
        break;
      case 1:
        menuType = 0;
        toggleBtnVisible = true;
        menuItems = [{
          enabled: true,
          id: 'menu-settings',
          data: false,
          label: 'Mainmenu',
          visible: true,
          glyphicon: 'glyphicon glyphicon-plus'
        }];
        break;
    }

    return {
      brand,
      menuType,
      menuItems,
      toggleBtnVisible
    };
  }

  tick = () => {

    // update rows randomly
    rows.tr[0].data[1] = getRandomNumber();
    rows.tr[0].data[3] = getRandomNumber();

    this.setState({ rows });
  }

  updateCurrentDateCell = (value) => {

    // log
    console.log('update current date cell', value);

    // update datepicker
    this.setState({
      datepicker: {
        value: value,
        show: false
      }
    });
  }

  onClickCell = (e) => {

    // log
    console.log(e);

    // get layout
    let { tr } = this.state.rows;

    // log
    // console.log(tr, layout);

    // get data-ridx
    let rIdx = e.currentTarget.getAttribute('data-ridx');
    let cIdx = e.currentTarget.getAttribute('data-cidx');

    // harcoded datepicker cell
    if (cIdx === 4) {

      // get random month
      // let m = getRandomInt(1, 12);
      let rValue = tr[rIdx].data[cIdx];

      // TODO:
      // transform from real value to date picker format value
      let dValue = convertDate(rValue, 'dd-mm-yy', 'dd/mm/yyyy');

      // todo: implement show date picker component
      this.setState({
        datepicker: {
          show: true,
          value: dValue
        }
      });
    } else {

      // update state
      this.setState({ editable: [rIdx, cIdx] });
    }
  }
};
