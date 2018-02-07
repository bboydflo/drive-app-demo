import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import * as gapiDemo from '../modules/google-auth-demo';

import Navbar from '../components/navbar';

class IndexPage extends Component {

  state = {
    files: [],
    initApi: false,
    signedIn: false,

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
    let { initApi, signedIn, files } = state;

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
            {files.length && files.map((f, idx) => {
              return <ul key={f.id} >name: {f.name} - id = {f.id} </ul>;
            })}
          </div>
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
