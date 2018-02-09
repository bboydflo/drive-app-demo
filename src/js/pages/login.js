import { h, Component } from 'preact';
import { connect } from 'preact-redux';
// import * as gapiDemo from '../modules/google-auth-demo';

import Navbar from '../components/navbar';

// import 'pdfjs-dist';

class IndexPage extends Component {

  state = {
    files: [],
    pdfData: null,

    // TODO: use global state instead
    error: {
      visible: false,
      title: '',
      message: ''
    }
  };

  render (props, state) {
    let { version } = props;
    let brand = <p class='navbar-text'>DriveApiDemo <code> {version}</code></p>;

    let pageContentStyles = 'padding-bottom: 51px';
    let { signedIn, isAppInstalled } = props;

    let isChrome = false;
    try {
      if (chrome) {
        isChrome = true;
      }
    } catch (e) {
      console.log('not chrome');
    }

    return (
      <div class='index-view'>
        <Navbar
          theme='inverse'
          brand={brand}
          menuType={0}
        />
        <div id='page-content' class='container' style={pageContentStyles}>
          <div class='row'>
            <button type='button' class='btn btn-default' id='authorize-button' style={signedIn ? 'display: none;' : 'display: block;'} onClick={this.handleAuth}>Sign in</button>
            <button type='button' class='btn btn-default' id='signout-button' style={signedIn ? 'display: block;' : 'display: none;'} onClick={this.handleSignOut}>Sign Out</button>
          </div>
          {isChrome && !isAppInstalled && <div class='row'>
            <button type='button' class='btn btn-success' id='install-button' onClick={this.handleInstall}>Add to Chrome</button>
          </div>}
        </div>
      </div>
    );
  }

  handleAuth = (ev) => {
    gapi.auth2.getAuthInstance().signIn();
  }

  handleSignOut = (ev) => {
    gapi.auth2.getAuthInstance().signOut();
  }

  // handle chrome inline install
  handleInstall = () => {
    // https://chrome.google.com/webstore/detail/drive-api-demo/hcamklaijpoffpejfbpedkmdimhmalnd
    if (!this.props.isAppInstalled) {
      chrome.webstore.install('https://chrome.google.com/webstore/detail/hcamklaijpoffpejfbpedkmdimhmalnd', () => {
        this.props.appInstalled();
      }, err => {
        console.error(err);
      });
    } else {
      // this.setState({ isAppInstalled: true });
      console.log('app is installed already');
    }
  }
};

const mapStateToProps = state => ({
  lang: state.ui.lang,
  fileId: state.ui.fileId,
  locale: state.ui.locale,
  signedIn: state.ui.signedIn,
  version: state.settings.version,
  isAppInstalled: state.ui.isAppInstalled
});

const mapDispatchToProps = dispatch => ({
  appInstalled: () => {

    // TODO: improve navbar click handling
    dispatch({ type: 'IS_APP_INSTALLED' });
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(IndexPage);
