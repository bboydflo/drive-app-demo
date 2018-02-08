import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import * as gapiDemo from '../modules/google-auth-demo';

import Navbar from '../components/navbar';

class IndexPage extends Component {

  state = {
    files: [],
    initApi: false,
    pdfData: null,
    signedIn: false,
    isAppInstalled: false,

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
    let { initApi, signedIn, files, isAppInstalled, pdfData } = state;

    return (
      <div class='index-view'>
        <Navbar
          theme='inverse'
          brand={brand}
          menuType={0}
        />
        <div id='page-content' class='container' style={pageContentStyles}>
          <div class='row'>
            <div>Hello world!</div>
            {!initApi && <button type='button' class='btn btn-default' onClick={this.initApi}>Init Google API</button>}
            <button type='button' class='btn btn-default' id='authorize-button' style={signedIn ? 'display: none;' : 'display: block;'} onClick={this.handleAuth}>Sign in</button>
            <button type='button' class='btn btn-default' id='signout-button' style='display: none;' onClick={this.handleSignOut}>Sign Out</button>
          </div>
          <div class='row'>
            <ul class='pdf-files-list'>
              {files.length && files.map((f, idx) => {
                return (
                  <li key={f.id}>
                    <span>name: {f.name} - id = {f.id}</span>
                    <button type='button' class='btn btn-info' data-id={f.id} onClick={this.downloadFile}>Download PDF File</button>
                  </li>
                );
              })}
            </ul>
          </div>
          {!isAppInstalled && <div class='row'>
            <button type='button' class='btn btn-success' id='install-button' onClick={this.handleInstall}>Add to Chrome</button>
          </div>}
          {pdfData && <div class='row'>
            <object data={pdfData} type='application/pdf' width='100%' height='100%'>
              <p>It appears you don't have a PDF plugin for this browser.</p>
            </object>
          </div>}
        </div>
      </div>
    );
  }

  componentDidMount () {
    if (chrome.app.isInstalled) {
      this.setState({ isAppInstalled: true });
    }
  }

  downloadFile = (ev) => {
    if (this.state.signedIn) {
      gapiDemo
        .getFileById(ev.currentTarget.dataset.id)
        .then(pdfData => {
          this.setState({ pdfData });
        })
        .catch(err => {
          console.log('Error during download', err);
        });
    }
  }

  handleAuth = (ev) => {
    gapi.auth2.getAuthInstance().signIn();
  }

  handleSignOut = (ev) => {
    gapi.auth2.getAuthInstance().signOut();
  }

  handleInstall = () => {
    // https://chrome.google.com/webstore/detail/drive-api-demo/hcamklaijpoffpejfbpedkmdimhmalnd
    chrome.webstore.install('https://chrome.google.com/webstore/detail/hcamklaijpoffpejfbpedkmdimhmalnd', () => {
      this.setState({ isAppInstalled: true });
    }, err => {
      console.error(err);
    });
  }

  updateSigninStatus = (isSignedIn) => {
    this.setState({
      signedIn: isSignedIn
    });
  }

  getFiles() {
    return gapiDemo
      .getFiles(10)
      .then(response => {
        // console.log(response);
        return this.setState({
          files: response.result.files
        });
      });
  }

  initApi = () => {
    gapiDemo.handleClientLoad(() => {
      gapiDemo
        .initClient()
        .then(() => {
          let isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
          this.updateSigninStatus(isSignedIn);

          if (isSignedIn) {
            this.getFiles();
          }

          this.setState({ initApi: true });
        });
    });
  }
};

const mapStateToProps = state => ({
  lang: state.ui.lang,
  locale: state.ui.locale,
  version: state.settings.version
});

export default connect(mapStateToProps, null)(IndexPage);
