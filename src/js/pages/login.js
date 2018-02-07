import { h, Component } from 'preact';
import { connect } from 'preact-redux';

import Navbar from '../components/navbar';
import Language from '../modules/lang';
import Const from '../modules/constants';

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
    let { error } = state;
    let { lang, version, credentials } = props;

    // log
    // console.log(state);

    // program lang
    let pLang = typeof Const.PROGRAM_LANGS[lang] === 'undefined' ? Const.PROGRAM_LANG_MAP['US'] : Const.PROGRAM_LANG_MAP[lang];

    // labels
    let loginLabel = Language.label.login.capitalizeFirstLetter();
    let chooseLangLabel = Language.label.chooseLang[pLang].capitalizeFirstLetter();

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
          </div>
        </div>
      </div>
    );
  }
};

const mapStateToProps = state => ({
  lang: state.ui.lang,
  locale: state.ui.locale,
  version: state.settings.version
});

export default connect(mapStateToProps, null)(IndexPage);
