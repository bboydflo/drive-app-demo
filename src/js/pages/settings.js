import _ from 'underscore';
import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import getProp from 'get-prop';
import CollapsiblePanels from '../components/collapsible-panels';
import Navbar from '../components/navbar';

import Const from '../modules/constants';
// import Language from '../modules/lang';

class SettingsPage extends Component {

  state = {
    dirty: false,
    collapsed: [false, true]
  };

  render (props, state) {
    let { collapsed } = state;
    // let { lang, device, isAndroid } = props;
    let { device, isAndroid } = props;

    let panels = [{
      id: 'general',
      label: 'General',
      collapsed: collapsed[0],
      glyphicon: 'check',
      bodyClass: 'general-b-class',
      body: (
        <ul class='list-group'>
          <li class='list-group-item clearfix' style='border: none;'>
            <span class='pull-left'>Version</span>
            <span class='pull-right'>12.04.87</span>
          </li>
          <li class='list-group-item' style='border: none;'>
            <button type='button' class='btn btn-primary btn-sm btn-block'>
              <span class='glyphicon glyphicon-save' /> Update
            </button>
          </li>
          <li class='list-group-item' style='border: none;'>
            <button type='button' class='btn btn-danger btn-sm btn-block'>
              <span class='glyphicon glyphicon-flash' /> Reset
            </button>
          </li>
          <li class='list-group-item' style='border: none;'>
            <button type='button' class='btn btn-default btn-sm btn-block'>
              <span class='glyphicon glyphicon-check' /> Test Database
            </button>
          </li>
          <li class='list-group-item clearfix' style='border: none;'>
            <div class='pull-left'>Make dirty</div>
            <div class='pull-right'>
              <div class='material-switch'>
                <input id='switch1' name='switch1' type='checkbox' onChange={this.toggleDirty} />
                <label for='switch1' class='label-primary' />
              </div>
            </div>
          </li>
        </ul>
      )
    }, {
      id: 'device',
      label: 'Bluetooth',
      collapsed: collapsed[1],
      glyphicon: 'phone',
      body: (
        <ul class='list-group'>
          <li class='list-group-item clearfix' style='border: none;'>
            <span class='pull-left'>Model</span>
            <span class='pull-right'>Nexus 7</span>
          </li>
          <li class='list-group-item clearfix' style='border: none;'>
            <span class='pull-left'>Version</span>
            <span class='pull-right'>5.1.1</span>
          </li>
          <li class='list-group-item clearfix' style='border: none;'>
            <div class='pull-left'>Bluetooth</div>
            <div class='pull-right'>
              <div class='material-switch'>
                <input id='switch2' name='switch2' type='checkbox' />
                <label for='switch2' class='label-primary' />
              </div>
            </div>
          </li>
          <li class='list-group-item clearfix' style='border: none;'>
            <span class='pull-left'>Reader</span>
            <span class='pull-right'>Destron</span>
          </li>
          <li class='list-group-item' style='border: none;'>
            <button type='button' class='btn btn-default btn-sm btn-block'>
              <span class='agrosoft-bluetooth' /> Connect
            </button>
          </li>
          <li class='list-group-item clearfix' style='border: none;'>
            <span class='pull-left'>Tag length</span>
            <span class='pull-right'>
              <div class='btn-group btn-group-sm'>
                <button type='button' class='btn btn-default range'>
                  <span class='glyphicon glyphicon-chevron-left' />
                </button>
                <input type='text' class='btn btn-default range-value' style='max-width: 45px;' value={'3'} />
                <button type='button' class='btn btn-default'>
                  <span class='glyphicon glyphicon-chevron-right' />
                </button>
              </div>
            </span>
          </li>
          <li class='list-group-item clearfix' style='border: none;'>
            <span class='pull-left' style='padding-top: 4px;'>Single</span>
            <span class='pull-right'>
              <div class='btn-group btn-group-sm'>
                <button type='button' class='btn btn-default range'>
                  <span class='glyphicon glyphicon-chevron-left' />
                </button>
                <input type='text' class='btn btn-default range-value' style='max-width: 45px;' value={'3'} />
                <button type='button' class='btn btn-default'>
                  <span class='glyphicon glyphicon-chevron-right' />
                </button>
              </div>
            </span>
          </li>
        </ul>
      )
    }];

    // if (Modernizr.smartpigs) {
    if (isAndroid) {
      // let device = session.get('device');

      // validate device. resume early
      if (!device || !_.isObject(device) || _.isEmpty(device)) return;

      // get device properties
      let dType = getProp(device, [Const.DEVICE_TYPE], -1);
      let dModel = getProp(device, [Const.DEVICE_MODEL], '');
      let dVersion = getProp(device, [Const.DEVICE_VERSION], -1);

      let d;
      if (dType) {
        d = (
          <li class='list-group-item' style='border: none;'>
            <button type='button' class='btn btn-default btn-sm btn-block'>
              <span class='glyphicon glyphicon-check' /> Device
            </button>
          </li>
        );
      }

      panels.push({
        id: 'device',
        label: 'Device',
        collapsed: collapsed[1],
        glyphicon: 'phone',
        body: (
          <ul class='list-group'>
            <li class='list-group-item clearfix' style='border: none;'>
              <span class='pull-left'>Version</span>
              <span class='pull-right'>{dVersion}</span>
            </li>
            <li class='list-group-item clearfix' style='border: none;'>
              <span class='pull-left'>Model</span>
              <span class='pull-right'>{dModel}</span>
            </li>
            {d}
          </ul>
        )
      });
    }

    // define brand
    let brand = <p class='navbar-text'>Settings</p>;

    // log
    console.log(props);

    return (
      <div class='settings-view'>
        <Navbar
          theme='inverse'
          brand={brand}
          menuType={0}
        />
        <div id='page-content' class={'container'}>
          <div class='row'>
            <div class='col-xs-12 col-sm-12 col-md-12'>
              <CollapsiblePanels panels={panels} onPanelClick={this.onPanelClick} />
              <button type='button' class='btn btn-primary btn-lg btn-block' onClick={this.onBack}>
                <span class='glyphicon glyphicon-arrow-left' /> Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  onNavbarClick = ev => {
    console.log(ev);
  }

  onBack = () => {
    window.location = '/';
    // use broker
  }

  onPanelClick = ev => {
    ev.preventDefault();
    ev.stopPropagation();

    let cIndex = parseInt(ev.currentTarget.getAttribute('data-index'), 10);
    this.setState({
      collapsed: this.state.collapsed.map((c, idx) => {
        if (idx === cIndex) {
          return !c;
        }
        return c;
      })
    });
  }

  toggleDirty = ev => {

    // console.log('checked: ' + ev.target.checked);
    this.setState({ dirty: ev.target.checked });

    // use broker to make settings page dirty
  }
};

const mapStateToProps = (state) => ({
  lang: state.ui.lang,
  pLang: state.ui.pLang,
  credentials: state.credentials
});

const mapDispatchToProps = dispatch => ({
  updateProgramLang: language => {
    dispatch({
      type: 'UPDATE_PROGRAM_LANG',
      value: language
    });
  },
  updateCredentialsField: (key, value) => {
    dispatch({
      type: 'UPDATE_CREDENTIALS_FIELD',
      key,
      value
    });
  },
  onNavbarClick: page => {

    // TODO: improve navbar click handling
    // dispatch(navigateAction(page));
  }
});

// wrap App in connect and pass in mapStateToProps
export default connect(mapStateToProps, mapDispatchToProps)(SettingsPage);
