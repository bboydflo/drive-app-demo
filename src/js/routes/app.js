import { h, Component } from 'preact';

// react router dom
// import { BrowserRouter } from 'react-router-dom';
// import { Route, Redirect, Switch, HashRouter } from 'react-router-dom';
import { Route, Switch, HashRouter } from 'react-router-dom';

export default (broker, session, LoginPage, SettingsPage, MainmenuPage) => {

  return class App extends Component {

    state = {
      session: null
    }

    constructor (props) {
      super(props);
      this.state.session = props.session.get();
    }

    componentDidMount () {
      broker.on('navigate', (type, e) => {
        console.log(e);
        console.log(type);
      });
    }

    render (props, state) {

      // log
      console.log(props);
      console.log(state);

      // get path
      let path = state.session.cache.page;

      return (
        <HashRouter>
          <Switch>
            <Route exact path={path} component={LoginPage} />
            <Route path={path} component={MainmenuPage} />
            <Route path={path} component={SettingsPage} />
          </Switch>
        </HashRouter>
      );
    }
  };
};
