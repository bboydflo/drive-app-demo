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
    let { files } = state;
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
            <button type='button' class='btn btn-default' id='signout-button' style='display: none;' onClick={this.handleSignOut}>Sign Out</button>
          </div>
          {false && <div class='row'>
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
          </div>}
          {!isAppInstalled && <div class='row'>
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

  downloadFile = (ev) => {
    if (this.props.signedIn) {
      let fileId = ev.currentTarget.dataset.id;
      let accessToken = gapiDemo.getAccessToken();
      let pdfUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&&access_token=${accessToken}`;

      let demo = true;
      if (demo) {
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
        return;
      }

      gapiDemo
        .getFileById(fileId)
        .then(pdfData => {
          // this.setState({ pdfData });

          // log
          console.log(pdfData);

          /* // Using DocumentInitParameters object to load binary data.
          var loadingTask = PDFJS.getDocument({ data: pdfData });
          loadingTask.promise.then(pdf => {
            console.log('PDF loaded');

            // Fetch the first page
            var pageNumber = 1;
            pdf.getPage(pageNumber).then(page => {
              console.log('Page loaded');

              var scale = 1.5;
              var viewport = page.getViewport(scale);

              // Prepare canvas using PDF page dimensions
              var canvas = document.getElementById('the-canvas');
              var context = canvas.getContext('2d');
              // canvas.height = viewport.height;
              // canvas.width = viewport.width;
              canvas.height = 800;
              canvas.width = 600;

              // Render PDF page into canvas context
              var renderContext = {
                canvasContext: context,
                viewport: viewport
              };
              var renderTask = page.render(renderContext);
              renderTask.then(() => {
                console.log('Page rendered');
              });
            });
          }, reason => {
            // PDF loading error
            console.error(reason);
          }); */

          // Loading a document.
          var loadingTask = pdfjsLib.getDocument({ data: pdfData });
          loadingTask.promise.then(pdfDocument => {

            // Request a first page
            return pdfDocument.getPage(1).then(pdfPage => {
              // Display page on the existing canvas with 100% scale.
              var viewport = pdfPage.getViewport(1.0);
              var canvas = document.getElementById('the-canvas');
              // canvas.width = viewport.width;
              // canvas.height = viewport.height;
              canvas.width = 640;
              canvas.height = 480;
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
    if (chrome) {
      chrome.webstore.install('https://chrome.google.com/webstore/detail/hcamklaijpoffpejfbpedkmdimhmalnd', () => {
        // this.setState({ isAppInstalled: true });
        console.log('TODO: dispatch IS_APP_INSTALLED action');
      }, err => {
        console.error(err);
      });
    } else {
      // this.setState({ isAppInstalled: true });
      console.log('app is installed already');
    }
  }

  /* // not used
  getFiles() {
    return gapiDemo
      .getFiles(10)
      .then(response => {
        // console.log(response);
        return this.setState({
          files: response.result.files
        });
      });
  } */
};

const mapStateToProps = state => ({
  lang: state.ui.lang,
  fileId: state.ui.fileId,
  locale: state.ui.locale,
  signedIn: state.ui.signedIn,
  version: state.settings.version,
  isAppInstalled: state.ui.isAppInstalled
});

export default connect(mapStateToProps, null)(IndexPage);
