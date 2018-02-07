import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import Flagstrap from 'flagstrap-preact';
import isPojo from 'is-pojo';

import Navbar from './navbar';
import Panel from './default-panel';
import ErrorView from './error';
import LoginForm from './login-form';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';

import Language from '../modules/lang';
import Const from '../modules/constants';

import { transformLoginResponse } from '../modules/utils';

// actions
import {
  login,
  throwError,
  updateLang,
  toggleSpinner,
  navigateAction,
  updateSessionData,
  updateCredentialsField
} from '../redux/actions/index';

/**
 * cs;Český;Česká republika
 * da;Dansk;Danmark
 * de;Deutch;Deutchland
 * en-gb;English GB;Great Britain
 * en-ph;English PH;Philippines
 * en-us;English US;USA
 * en-au;English AU;Australia
 * es;Español;España
 * et;Eesti;Eesti
 * fi;Suomi;Suomi
 * ja;日本人;日本
 * nl;Nederlands;Nederland
 * no;Norsk;Norge
 * pl;Polski;Polska
 * ru;Pусский;Россия
 * sv;Svenska;Sverige
 * uk;Український;Україна
 * zh;中国的;中国
 * th;ไทย;ประเทศไทย
 * mk;македонски;Македонија
 * sr;Србин;Србија
 * bg;български;България
 * vi;Tiếng Việt;Việt Nam
 */
let countries = {
  'US': 'English US',
  'DK': 'Dansk',
  'NL': 'Nederlands',
  'DE': 'Deutsch',
  'AU': 'English AU',
  'BG': 'български',
  'CN': '中国的',
  'CZ': 'Český',
  'ES': 'Español',
  'EE': 'Eesti',
  'FI': 'Suomi',
  'GB': 'English GB',
  'JP': '日本人',
  'MK': 'македонски',
  'NO': 'Norsk',
  'PH': 'English PH',
  'PL': 'Polski',
  'RU': 'Pусский',
  'RS': 'Србин',
  'SE': 'Svenska',
  'UA': 'Український',
  'TH': 'ไทย;ประเทศไทย',
  'VN': 'Tiếng Việt'
};

// define a map between target findex and updated credential
let fIndexToCredentials = ['database', 'databasePW', 'user', 'userPW'];

/**
 * update credentials based on loginType
 * update session data
 * update app page
 * toggle spinner
 */
const onLoginSuccess = function (resp) {

  // validate response. should be a javascript object
  if (!isPojo(resp)) {

    // dispatch login error
    // throw new Error('response is not an plain object');
    throwError({ message: 'response is not an plain object' });
  }

  // validate session key
  if (!resp.hasOwnProperty('sessionKey') || resp.sessionKey.length === 0) {

    // dispatch login error
    // throw new Error('invalid session key');
    throwError({ message: 'invalid session key' });
  }

  // throw an error using redux action
  // this.props.throwError({ message: 'redux compliant actions payload' });

  console.log(resp);

  // TODO:
  // update credentials based on response session type

  // add response transformation
  let transformedResp = transformLoginResponse(resp);

  // update session data
  this.props.updateSessionData(transformedResp);

  // navigate to mainmenu
  this.props.navigateToMainMenu();

  // toggle spinner
  this.props.toggleSpinner();
};

const onLoginError = err => {
  console.log(err);
};

class LoginScreen extends Component {

  state = {
    hasSlider: false,
    modalType: true, // modal dialog type. true: can be manually hidden, false: cannot be manually hidden
    dialogType: -1, // settings dialog on/off [-1 none, 0 settings, 1 bluetooth, 2 logout, 3 relogin, 4 go offline]
    showModal: false,

    // TODO: use global state instead
    error: {
      visible: false,
      title: '',
      message: ''
    }
  };

  render (props, state) {
    let { error } = state;
    let { lang, version, credentials } = props;

    // log
    // console.log(state);

    // program lang
    let pLang = typeof Const.PROGRAM_LANGS[lang] === 'undefined' ? Const.PROGRAM_LANG_MAP['US'] : Const.PROGRAM_LANG_MAP[lang];

    let panelTitle = (
      <h3 class='panel-title'>
        <span class='glyphicon glyphicon-user' aria-hidden='true' /> Login
      </h3>
    );

    // labels
    let loginLabel = Language.label.login.capitalizeFirstLetter();
    let chooseLangLabel = Language.label.chooseLang[pLang].capitalizeFirstLetter();

    let panelFooter = (
      <div class='login-panel-footer'>
        <button type='submit' class='btn btn-block btn-primary' onClick={this.onLogin}>
          <span class='glyphicon glyphicon-log-in' aria-hidden='true' /> {loginLabel}
        </button>
      </div>
    );

    // get placeholders
    let placeholders = {
      db: Language.label.database[pLang],
      user: Language.label.user[pLang],
      pass: Language.label.password[pLang]
    };

    // define fields info
    let fields = [{
      icon: <i class='fa fa-database' />,
      type: 'text',
      value: credentials.database,
      placeholder: placeholders.db
    }, {
      icon: <i class='fa fa-key' />,
      type: 'password',
      value: credentials.databasePW,
      placeholder: placeholders.pass
    }, {
      icon: <span class='glyphicon glyphicon-user' aria-hidden='true' />,
      type: 'text',
      value: credentials.user,
      placeholder: placeholders.user
    }, {
      icon: <span class='fa fa-key' aria-hidden='true' />,
      type: 'password',
      value: credentials.userPW,
      placeholder: placeholders.user
    }];

    // define top navbar details
    let bottomNavbarItems = [{
      enabled: true,
      id: 'menu-settings',
      data: false,
      label: Language.label.settings[pLang].capitalizeFirstLetter(),
      visible: true,
      icon: 'glyphicon glyphicon-cog',
      color: '#222222',
      showLabel: true,
      event: 'settings'
    }];

    let brand = <p class='navbar-text'>SmartPigs <code> {version}</code></p>;

    let pageContentStyles = 'padding-bottom: 51px';

    return (
      <div class='index-view'>
        <Navbar
          theme='inverse'
          brand={brand}
          menuType={0}
        />
        <div id='page-content' class='container' style={pageContentStyles}>
          <div class='row'>
            <div class='col-xs-12 col-sm-offset-3 col-sm-6 col-md-offset-4 col-md-4'>
              <Panel title={panelTitle} footer={panelFooter}>
                {error.visible && <ErrorView {...error} onClose={this.onHideError} />}
                <div class='login-component'>
                  <LoginForm
                    fields={fields}
                    onFieldChanged={this.onFieldChanged}
                  >
                    <div class='form-group'>
                      <Flagstrap
                        countries={countries}
                        selected={lang}
                        choose={chooseLangLabel}
                        onChange={this.onChangeLang}
                      />
                    </div>
                  </LoginForm>
                </div>
              </Panel>
            </div>
          </div>
        </div>
        <Navbar
          items={bottomNavbarItems}
          menuType={1}
          position='bottom'
          onNavbarClick={this.onNavbarClick}
        />
        <Modal show={this.state.showModal} onHide={this.closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Text in a modal</h4>
            <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
            {/* <p>there is a <OverlayTrigger overlay={popover}><a href="#">popover</a></OverlayTrigger> here</p> */}
            {/* <p>there is a <OverlayTrigger overlay={tooltip}><a href="#">tooltip</a></OverlayTrigger> here</p> */}
            <hr />

            <h4>Overflowing text to show scroll behavior</h4>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeModal}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

  onHideError = () => {
    this.setState({
      error: Object.assign({}, this.state.error, {visible: false})
    });
  }

  closeModal = () => {}

  onNavbarClick = ev => {
    // console.log(ev);
    // console.log(this.props);

    // console.log(ev.currentTarget.dataset.event);
    let evItem = ev.currentTarget.getAttribute('data-event');

    // log
    // console.log(evItem);
    this.props.onNavbarClick(evItem);
  }

  onFieldChanged = ev => {
    const value = ev.target.value;
    const fIndex = parseInt(ev.target.dataset.findex, 10);

    // this comes from connect -> mapDispatchToProps
    this.props.updateCredentialsField(fIndexToCredentials[fIndex], value);
  }

  // define onLogin handler
  onLogin = e => {
    let {
      lang,
      appVersion,
      credentials,
      serverAddress
    } = this.props;

    // log
    console.log(this.props);

    // program lang
    let pLang = typeof Const.PROGRAM_LANGS[lang] === 'undefined' ? Const.PROGRAM_LANG_MAP['US'] : Const.PROGRAM_LANG_MAP[lang];

    for (let field in credentials) {
      if (!credentials.hasOwnProperty(field) || !credentials[field]) {
        return this.setState({
          error: {
            visible: true,
            title: `SmartPigs ${Language.label.error[pLang]}: `,
            message: Language.error.requiredField[pLang]
          }
        });
      }
    }

    // add lang and locale to login payload
    credentials.lang = this.props.lang;
    credentials.locale = this.props.locale;

    // dispatch action
    this.props.toggleSpinner();

    // let appVersion = session.get('device', Const.APP_VERSION) || utils.generateRowId();

    // if app_version
    // if (Modernizr.smartpigs && appVersion.length) {
    if (Modernizr.smartpigs && appVersion.length) {

      // let appName = session.get('device', Const.APP_NAME) || 'sPigs.apk';
      let appName = 'sPigs.apk';

      // add new attributes to credentials
      credentials.app_name = appName;
      credentials.app_version = appVersion;
    }

    // let appName = session.get('device', Const.APP_NAME) || 'sPigs.apk';
    // let appVersion = session.get('device', Const.APP_VERSION) || utils.generateRowId();

    /* // if app_version
    if (Modernizr.smartpigs && appVersion.length) {

      // add new attributes to credentials
      credentials.app_name = appName;
      credentials.app_version = appVersion;
    } */

    // TODO: finish login action in the most scalable way
    this.props.login({
      url: `${serverAddress}login.html`,
      method: 'POST',
      body: credentials,
      responseType: 'json',
      onSuccess: onLoginSuccess.bind(this),
      onError: onLoginError
    });
  };

  onDismiss = () => {}

  onChangeLang = value => {
    this.props.updateProgramLang(value);
  }
};

const mapStateToProps = state => ({
  lang: state.ui.lang,
  locale: state.ui.locale,
  version: state.settings.version,
  credentials: state.credentials,
  serverAddress: state.device.serverAddress
});

const mapDispatchToProps = dispatch => ({
  toggleSpinner: () => {
    dispatch(toggleSpinner());
  },
  updateProgramLang: language => {
    dispatch(updateLang(language));
  },
  updateCredentialsField: (key, value) => {
    dispatch(updateCredentialsField({key, value}));
  },
  onNavbarClick: page => {

    // TODO: improve navbar click handling
    dispatch(navigateAction(page));
  },
  navigateToMainMenu: () => {
    dispatch(navigateAction('mainmenu'));
  },
  login: payload => {
    // console.log(payload);
    dispatch(login(payload));
  },
  throwError: payload => {
    dispatch(throwError(payload));
  },
  updateSessionData: payload => {
    dispatch(updateSessionData(payload));
  }
});

console.log(`
  ================= TODO =================
  | refactor redux state to accept login |
  | response as it is                    |
  |https://medium.com/@reinelmp/batching-|
  |redux-actions-a68daaa2d492            |
  ================= TODO =================
`);

export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen);
