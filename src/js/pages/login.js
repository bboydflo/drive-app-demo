import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import * as gapiDemo from '../modules/google-auth-demo';

import Navbar from '../components/navbar';

// import 'pdfjs-dist';

import pdfjsLib from 'pdfjs-dist';

// Setting worker path to worker bundle.
// pdfjsLib.PDFJS.workerSrc = '../../build/webpack/pdf.worker.bundle.js';
pdfjsLib.PDFJS.workerSrc = './src/js/vendor/pdf.worker.js';

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
          {chrome && !isAppInstalled && <div class='row'>
            <button type='button' class='btn btn-success' id='install-button' onClick={this.handleInstall}>Add to Chrome</button>
          </div>}
        </div>
      </div>
    );
  }

  componentDidMount () {
    if (this.props.signedIn && this.props.fileId) {
      let accessToken = gapiDemo.getAccessToken();
      let pdfUrl = `https://www.googleapis.com/drive/v3/files/${this.props.fileId}?alt=media&&access_token=${accessToken}`;
      let loadingTask = pdfjsLib.getDocument(pdfUrl);
      loadingTask.promise.then(pdfDocument => {

        // request the first page only
        return pdfDocument.getPage(1).then(pdfPage => {

          // Display page on the existing canvas with 100% scale.
          var viewport = pdfPage.getViewport(1.0);
          var canvas = document.getElementById('the-canvas');

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // canvas.width = 640;
          // canvas.height = 480;

          var ctx = canvas.getContext('2d');
          var renderTask = pdfPage.render({
            canvasContext: ctx,
            viewport: viewport
          });
          return renderTask.promise;
        });
      }).catch(function (reason) {
        console.error('Error: ' + reason);
      });
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
