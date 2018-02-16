// import 'material-design-lite';
import 'materialize-css';
import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import { renderStructure, getFolderStructure } from '../modules/google-auth-demo';
import Navbar from '../components/navbar';
import { toggleSpinner } from '../redux/actions';

class IndexPage extends Component {

  state = {
    t: null,
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
    let bootstrapTheme = false;
    let materialLiteTheme = false;
    if (bootstrapTheme) {
      return bootstrapRender.call(this, props, state);
    }
    if (materialLiteTheme) {
      return materialRender.call(this, props, state);
    }

    // render the tree structure (if any)
    if (state.t) {
      state.t.traverseBF(node => {

        // if (node && node.data && node.data.id === rootId) {
        if (node && node.data && node.data.name === 'root') {
          renderStructure(node);
        }
      });
    }

    return materializeRender.call(this, props, state);
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

  getFolderStructure = () => {
    this.props.toggleSpinner();
    getFolderStructure().then(tree => {

      // update tree structure
      this.setState({ t: tree }, () => this.props.toggleSpinner());
    });
  }
};

function bootstrapRender (props, state) {
  let { version, signedIn, isAppInstalled } = props;
  let brand = <p class='navbar-text'>DriveApiDemo <code> {version}</code></p>;

  let pageContentStyles = 'padding-bottom: 51px';

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
          <button type='button' class='btn btn-default' style={signedIn ? 'display: none;' : 'display: block;'} onClick={this.handleAuth}>Sign in</button>
          <button type='button' class='btn btn-default' style={signedIn ? 'display: block;' : 'display: none;'} onClick={this.handleSignOut}>Sign Out</button>
          <button type='button' class='btn btn-default' onClick={this.getFolderStructure}>Get Folder structure</button>
        </div>
        <div class='row'>
          <button type='button' class='btn btn-default' onClick={this.smartQuery}>Run smart query</button>
        </div>
        {isChrome && !isAppInstalled && <div class='row'>
          <button type='button' class='btn btn-success' id='install-button' onClick={this.handleInstall}>Add to Chrome</button>
        </div>}
      </div>
    </div>
  );
}

function materialRender (props, state) {
  let { signedIn, isAppInstalled } = props;

  let isChrome = false;
  try {
    if (chrome) {
      isChrome = true;
    }
  } catch (e) {
    console.log('not chrome');
  }

  // {signedIn ? <button class='mdl-button mdl-js-button mdl-button--raised' onClick={this.handleSignOut}>Sign Out</button> : <button class='mdl-button mdl-js-button mdl-button--raised' onClick={this.handleAuth}>Sign in</button>}

  return (
    <div class='mdl-layout mdl-js-layout'>
      <div class='mdl-grid'>
        <div class='mdl-cell mdl-cell-4-col'>
          <button class='mdl-button mdl-js-button mdl-button--raised' onClick={signedIn ? this.handleSignOut : this.handleAuth}>{signedIn ? 'Sign Out' : 'Sign In'}</button>
        </div>
        <div class='mdl-cell mdl-cell-4-col'>
          <button class='mdl-button mdl-js-button mdl-button--raised' onClick={getFolderStructure}>Open File</button>
        </div>
        {isChrome && !isAppInstalled && <div class='mdl-cell mdl-cell-4-col'>
          <button class='mdl-button mdl-js-button mdl-button--raised'>Add to Chrome</button>
        </div>}
      </div>
    </div>
  );
}

function materializeRender (props, state) {
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
    <div class='container'>
      <div class='row'>
        <div class='col s4'>
          <button class='btn waves-effect waves-light' type='submit' onClick={signedIn ? this.handleSignOut : this.handleAuth} name='action'>{signedIn ? 'Sign Out' : 'Sign In'}
            <i class='material-icons right'>send</i>
          </button>
        </div>
        <div class='col s4'>
          <button class='btn waves-effect waves-light' type='submit' onClick={this.getFolderStructure} name='action'>Open File
          <i class='material-icons right'>send</i>
          </button>
        </div>
        <div class='col s4'>
          {isChrome && !isAppInstalled && <button class='btn waves-effect waves-light' type='submit' onClick={this.getFolderStructure} name='action'>Open File
          <i class='material-icons right'>send</i>
          </button>}
        </div>
      </div>
    </div>
  );
}

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
  },
  toggleSpinner: () => {
    dispatch(toggleSpinner());
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(IndexPage);

/*
  <div class='demo-layout-transparent mdl-layout mdl-js-layout'>
    <header class='mdl-layout__header mdl-layout__header--transparent'>
      <div class='mdl-layout__header-row'>
        <span class='mdl-layout-title'>DriveApiDemo {version}</span>
        <div class='mdl-layout-spacer' />
        <nav class='mdl-navigation'>
          <a class='mdl-navigation__link' href='#'>Sign in</a>
        </nav>
      </div>
    </header>
    <div class='mdl-layout__drawer'>
      <span class='mdl-layout-title'>DriveApiDemo {version}</span>
      <nav class='mdl-navigation'>
        <a class='mdl-navigation__link' href='#'>Sign In</a>
      </nav>
    </div>
    <main class='mdl-layout__content'>
      <a href='#' id='open-file' class='mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color--accent mdl-color-text--accent-contrast' data-upgraded=',MaterialButton,MaterialRipple'>Open File<span class='mdl-button__ripple-container'><span class='mdl-ripple is-animating' style='width: 255.962px; height: 255.962px; transform: translate(-50%, -50%) translate(34px, 15px);' /></span></a>
    </main>
  </div>
*/
