import { h, Component } from 'preact';
import LoginScreen from './login-screen';
import SettingsScreen from './settings-page';
import MainmenuScreen from './settings-page';
import { connect } from 'preact-redux';
import { updateUrl } from '../redux/actions';

const mapAppStateToProps = state => ({ ...state });

const mapDispatchToProps = dispatch => ({
  updateUrl: url => {
    dispatch(updateUrl(url));
  }
});

class App extends Component {
  constructor (props) {
    super(props);
    this.router = null;
    this.updateHistory = this.updateHistory.bind(this);
  }
  render (props) {
    let { url } = props.ui;

    // login page
    if (url === '' || url === 'index') return <LoginScreen />;

    // settings
    if (url === 'settings') {
      return <SettingsScreen />;
    }

    // mainmenu
    if (url === 'mainmenu') {
      return <MainmenuScreen />;
    }

    return <p>Hello SmartPigs!</p>;
  }

  componentDidMount () {

    // create app router (once)
    this.router = new this.props.Router({
      initialUrl: this.props.ui.url,
      updateHistory: this.updateHistory
    });

    // start browser history
    this.router.start();
  }

  updateHistory (prevUrl, currentUrl, _historyLog) {
    console.log('url has changed to:', currentUrl);

    console.log(_historyLog);
    console.log(this.props);

    // TODO: implement gateway the same way as in NAVIGATE_TO

    // dispatch update url
    this.props.updateUrl(currentUrl);
  }
};

// export connected App component
export default connect(mapAppStateToProps, mapDispatchToProps)(App);
