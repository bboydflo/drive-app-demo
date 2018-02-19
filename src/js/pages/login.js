// import 'material-design-lite';
import M from 'materialize-css';
import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import { showPicker, getFolderStructure } from '../modules/google-auth-demo';
// import { renderStructure } from '../modules/google-auth-demo';
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

    var el = null;

    // render the tree structure (if any)
    if (state.t) {
      state.t.traverseBF(node => {

        // if (node && node.data && node.data.id === rootId) {
        if (node && node.data && node.data.name === 'root') {
          el = (
            <div id='modal1' class='modal'>
              <div class='modal-content'>
                <h4>Choose file</h4>
                <div class='scroll-wrapper'>
                  <div class='row'>
                    {createNestedList(node)}
                  </div>
                </div>
              </div>
              <div class='modal-footer'>
                <a href='#!' class='modal-action modal-close waves-effect waves-green btn-flat'>Agree</a>
              </div>
            </div>
            // <div class='container'>
            //   <div class='row'>
            //     {createNestedList(node)}
            //   </div>
            // </div>
          );
        }
      });

      return el;
    }

    return materializeRender.call(this, props, state);
  }

  componentDidUpdate() {
    if (this.state.t) {
      /* var elem = document.querySelector('.collapsible');
      // var instance = M.Collapsible.init(elem, options);
      M.Collapsible.init(elem); */
      $('.collapsible').collapsible();
      // $('.modal').modal();
      // $('.modal').open();

      // open modal
      var elem = document.querySelector('.modal');
      var instance = M.Modal.init(elem);
      instance.open();
    }
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

  openDrivePicker = () => {
    showPicker();
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
          <button class='btn waves-effect waves-light' type='submit' onClick={this.openDrivePicker} name='action'>Open Drive Picker
          <i class='material-icons right'>folder</i>
          </button>
        </div>
        <div class='col s4'>
          <button class='btn waves-effect waves-light' type='submit' onClick={this.getFolderStructure} name='action'>See Drive Folders
          <i class='material-icons right'>folder_open</i>
          </button>
        </div>
        <div class='col s4'>
          {isChrome && !isAppInstalled && <button class='btn waves-effect waves-light' type='submit' onClick={this.getFolderStructure} name='action'>Add to Chrome
          <i class='material-icons right'>apps</i>
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

function createNestedList(node) {
  let i, item;
  let items = null;
  if (node.children && node.children.length) {
    items = [];
    for (i = 0; i < node.children.length; i++) {
      if (node.children[i].data.fileExtension) {
        item = (
          <li>
            <div class='collapsible-header'><i class='material-icons'>insert_drive_file</i>
              {node.children[i].data.name || node.children[i].data.id}
            </div>
          </li>
        );
      } else {
        item = (
          <li>
            <div class='collapsible-header'><i class='material-icons'>folder</i>
              {node.children[i].data.name || node.children[i].data.id}
            </div>
            <div class='collapsible-body'>
              <span>
                {createNestedList(node.children[i])}
              </span>
            </div>
          </li>
        );
      }
      items.push(item);
    }
    return (
      <ul class='collapsible' data-collapsible='accordion'>
        {/* {items.map(item => item)} */}
        {items}
      </ul>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(IndexPage);
