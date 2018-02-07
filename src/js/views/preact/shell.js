import { h, Component } from 'preact';
// import MenubarFactory from './Menubar';

export default (Menubar) => {

  // exports a component
  return class Shell extends Component {
    render(props) {

      /* // define app state
      var appState = {
        lang: lang,         // current language
        full: true,         // render full top view
        popup: false,       // popup state
        loaded: true,       // page loaded
        pageName: oldPage,  // cached page name
        fadeInMs: 100,      // fade in duration
        fadeOutMs: 10,      // fade out duration
        popupType: true,    // dialog type. true -> can be manually hidden, false -> cannot be manually hidden
        connection: session.get( 'app', 'connection' )
      }; */

      // log
      console.log(props);

      // log
      console.log(Menubar);

      /* let appState = {
        pageName: 'index',

        // fade in/out duration
        fadeInMs: 0,
        fadeOutMs: 0,

        // dialog type. true -> can be manually hidden, false -> cannot be manually hidden
        popupType: true,

        // global in progress state
        inProgress: false
      }; */

      // get menubar
      // let Menubar = MenubarFactory(Language, session, false);

      return (
        <div>
          <nav class='navbar navbar-inverse navbar-fixed-top' id='toggleNav' role='navigation'>
            <Menubar lang='en-us' />
          </nav>
          <div id='page-content'></div>
          <div class='generic-modal'></div>
          <div class='gpu-boost'></div>
        </div>
      );
    }
  };
};