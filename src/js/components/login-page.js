import _ from 'underscore';
import getProp from 'get-prop';
import { h, Component } from 'preact';
import Flagstrap from 'flagstrap-preact';

import Navbar from './navbar';
import Panel from './default-panel';
import ErrorView from './error';
import LoginForm from './login-form';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';

import Language from '../modules/lang';
import Const from '../modules/constants';

export default (broker, loginApi, utils, session) => {

  // define methods
  let map = _.map;
  let isArray = _.isArray;

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

  return class LoginPage extends Component {

    state = {
      hasSlider: false,
      modalType: true, // modal dialog type. true: can be manually hidden, false: cannot be manually hidden
      dialogType: -1, // settings dialog on/off [-1 none, 0 settings, 1 bluetooth, 2 logout, 3 relogin, 4 go offline]
      lang: session.get('settings', 'lang'),
      showModal: false,
      credentials: session.get('cache', 'credentials'),
      error: {
        visible: false,
        title: '',
        message: ''
      }
    };

    render (props, state) {

      // get program language
      let pLang = session.get('settings', 'pLang');

      // get current lang
      let { lang, error, credentials } = state;

      let panelTitle = (
        <h3 class='panel-title'>
          <span class='glyphicon glyphicon-user' aria-hidden='true' /> Login
        </h3>
      );

      // labels
      let loginLabel = session.get('sp_lang', 'SP_ButtonLogin') || Language.button.login[lang];

      let panelFooter = (
        <div class='florin-cosmin'>
          <button type='submit' class='btn btn-block btn-primary' onClick={this.onLogin}>
            <span class='glyphicon glyphicon-log-in' aria-hidden='true' /> {loginLabel}
          </button>
        </div>
      );

      // get placeholders
      let placeholders = {
        db: session.get('sp_lang', 'SP_IndexDatabase') || Language.index.database[lang],
        user: session.get('sp_lang', 'SP_IndexUser') || Language.index.user[lang],
        pass: session.get('sp_lang', 'SP_IndexPassword') || Language.index.password[lang]
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
        label: Language.settingsModal.title[lang],
        visible: true,
        icon: 'glyphicon glyphicon-cog',
        color: '#222222',
        showLabel: true,
        event: 'settings'
      }];

      let brand = <p class='navbar-text'>SmartPigs <code> {session.get('app', 'version')}</code></p>;

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
                          selected={pLang}
                          choose={'Choose something'}
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

    closeModal = () => {
      this.setState({ showModal: false });
    }

    onNavbarClick = (ev) => {
      ev.preventDefault();

      // log
      console.log(ev.currentTarget.getAttribute('data-event'));
      // console.log(ev.currentTarget.dataset.event);

      // log
      // console.log(this.props);

      // set state
      // this.setState({ showModal: true });

      // go to settings page
      // Backbone.history.navigate('settings', {trigger: true});

      // use broker navigate
      broker.emit('navigate', ['settings', {key1: 'value1', key2: true, key3: function () {}, key4: []}]);
    }

    onFieldChanged = (ev) => {
      const value = ev.target.value;
      const fIndex = parseInt(ev.target.dataset.findex, 10);

      // get updated credentials
      let credentials = Object.assign({}, this.state.credentials, {
        [fIndexToCredentials[fIndex]]: value
      });

      this.setState({ credentials });
    }

    // define onLogin handler
    onLogin = (e) => {

      // check if development
      if (process.env.NODE_ENV === 'development') {

        // log
        console.log(e);
      }

      let { lang } = this.state;

      // get current credentials and validate them
      let credentials = this.state.credentials;

      // TODO: validate credentials
      for (let v in credentials) {
        if (!credentials[v]) {
          return this.setState({
            error: {
              visible: true,
              title: 'Login Error:',
              message: 'All fields are required.'
            }
          });
        }
      }

      // keep update session
      session.set('cache', 'credentials', credentials);

      // hide error -> triggers refresh
      this.onHideError();

      // launch spinner
      $.publish('smartpigs', ['spinner', { state: true }]);

      let appName = session.get('device', Const.APP_NAME) || 'sPigs.apk';
      let appVersion = session.get('device', Const.APP_VERSION) || utils.generateRowId();

      // if app_version
      if (Modernizr.smartpigs && appVersion.length) {

        // add new attributes to credentials
        credentials.app_name = appName;
        credentials.app_version = appVersion;
      }

      const serverAddress = session.get('device', Const.SERVER_URL);
      let url = `${serverAddress}login.html`;

      // login
      loginApi.loginController(url, credentials)
        .then(response => {

          // development
          // if (true) throw new CustomError('some error message', ErrorTypes.NO_CONNECTION, ev);

          // publish connection change event
          $.publish('smartpigs', ['connection-changed', { state: Const.NET_CONNECTED }]);

          // update layouts icon name
          utils.setLayoutsIconName(response);

          let spLang = {};

          // get sp texts
          let texts = getProp(response, ['texts']) || '';

          // check texts
          if (texts) {

            // parse reponse
            texts = texts.split('","');

            // check langs
            if (isArray(texts) && texts.length) {

              // map through langs and create countries
              map(texts, val => {
                if (!val) return;

                let wordDetails = val.split(':');

                if (!isArray(wordDetails) || wordDetails.length < 2) return;

                // original values. remove commas
                let wordCode = wordDetails[0].replace(/"/g, '');
                let wordText = wordDetails[1].replace(/"/g, '');

                if (!wordCode || wordText === ' ') return;

                // update countries collection
                spLang[wordCode] = wordText;
              });
            }

            // delete texts from response
            delete response.texts;
          }

          // get date format
          // update default date format in order to accomodate the new formatting library
          let dateFormat = getProp(response, ['dataFormat']) || 'dd-MM-yy';

          // strip out ['']
          dateFormat = dateFormat.replace(/'/g, '');

          // save layouts
          session
            .set('layouts', response)
            .set('sp_lang', spLang)
            .set('settings', 'dateFormat', dateFormat)
            .persist();

          // Backbone.history.navigate('mainmenu', { trigger: true });
          broker.emit('navigate', ['mainmenu']);

          // resolve the promise eventually
          return true;
        })
        .catch(err => {
          console.log(err);
          let u2 = session.get('sp_lang', 'SP_IndexErrorMsg1') || Language.index.errorMsg1[lang];
          let errType = getProp(err, ['type'], 1);
          let errMessage = getProp(err, ['message'], u2);
          let serverAddress = session.get('device', Const.SERVER_URL) || '/';

          // toast
          $.publish('smartpigs', ['toast', {
            type: 0,
            message: `Error: ${err.message}. (server address: ${serverAddress})`,
            options: {
              hideDuration: 20000
            }
          }]);

          if (errMessage === 'update') {

            // update app
            $.publish('smartpigs', ['update-app', {appName, appVersion}]);
          } else {

            // not 'loginFailed'
            if (errType === 1) {

              // update message
              errMessage = Language.index.errorMsg1[lang];
            }

            // define title
            let title = 'Server ' + Language.index.errorMsg6[lang] + ': ';

            // update title
            title = title.capitalizeFirstLetter();

            // update error
            this.setState({
              error: {
                visible: true,
                title: title,
                message: errMessage
              }
            });
          }

          // hide spinner
          $.publish('smartpigs', ['spinner', { state: false }]);
        });
    };

    onDismiss = () => {
      this.setState({ hasModal: false });
    }

    onChangeLang = (value) => {

      // check if empty
      if (!value) return;

      if (session.get('settings', 'pLang') === value) {
        /* if (process.env.development) {
          console.log('the same language -> resume');
        } */
        console.log('the same language -> resume');
        return;
      }

      // log
      console.log('new program lang: ', value);

      // default program language
      let cLang = 'en-us';

      // loop through programCountriesMap to find the current language key
      for (let keyLang in Const.PROGRAM_LANGS) {
        if (value === keyLang) {
          cLang = Const.PROGRAM_LANGS[value];
          break;
        }
      }

      // update program language anyway
      session.set('settings', {pLang: value, lang: cLang}).persist();

      // update state
      this.setState({ lang: cLang });
    }
  };
};
