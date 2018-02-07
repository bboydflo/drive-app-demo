import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import * as gapiDemo from '../modules/google-auth-demo';

import Navbar from '../components/navbar';

class IndexPage extends Component {

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
    let { version } = props;
    let brand = <p class='navbar-text'>DriveApiDemo <code> {version}</code></p>;

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
            <div>Hello world!</div>
            <button type='button' class='btn btn-default' onClick={this.onAuth}>Google Auth</button>
          </div>
        </div>
      </div>
    );
  }

  onAuth = (ev) => {
    gapi.load('client:auth2', gapiDemo.initClient);
  }

  componentDidMount() {
    // gapiDemo.handleClientLoad();
  }
};

const mapStateToProps = state => ({
  lang: state.ui.lang,
  locale: state.ui.locale,
  version: state.settings.version
});

export default connect(mapStateToProps, null)(IndexPage);
