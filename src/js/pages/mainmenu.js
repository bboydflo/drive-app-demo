import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import getProp from 'get-prop';
import isPojo from 'is-pojo';
import Navbar from '../components/navbar';
import Const from '../modules/constants';
// import Language from '../modules/lang';
import { getLayoutBy } from '../modules/utils';

// actions
import { navigateAction } from '../redux/actions/index';

class MainmenuPage extends Component {

  state = {
    // lang: session.get('settings', 'lang'),
    showModal: false,
    error: {
      visible: false,
      title: '',
      message: ''
    }
  };

  render (props, state) {

    // get current lang
    let { layouts } = props;
    // let { lang, layouts } = props;

    let brand = <p class='navbar-text'>Allan Andresen</p>;

    let pageContentStyles = 'padding-bottom: 51px';

    // define top navbar details
    let bottomNavbarItems = [{
      enabled: true,
      id: 'menu-back',
      data: false,
      label: 'Back',
      visible: true,
      icon: 'glyphicon glyphicon-arrow-left',
      // color: '#222222',
      spanClass: '',
      showLabel: true,
      event: 'back'
    }, {
      enabled: true,
      id: 'menu-settings',
      data: false,
      label: 'Go offline',
      visible: true,
      icon: 'glyphicon glyphicon-off',
      // color: '#222222',
      spanClass: '',
      showLabel: true,
      event: 'settings'
    }, {
      enabled: true,
      id: 'menu-logout',
      data: false,
      label: 'Logout',
      visible: true,
      icon: 'glyphicon glyphicon-log-out',
      spanClass: '',
      // color: '#222222',
      showLabel: true,
      event: 'logout'
    }];

    let panelKeyPrefix = 'panel-key-';

    let panels = Object.keys(layouts).filter(key => {

      // filter plain objects
      // added support to filter out nested layouts
      if (isPojo(layouts[key]) && key !== 'nested') {

        // filter out empty columns
        if (getProp(layouts[key], ['items'], []).length) {

          // return value
          return layouts[key];
        }
      }
      return false;
    }).map((side, idx) => (
      <div key={panelKeyPrefix + idx} class='panel panel-success'>
        <div class='panel-heading'>{layouts[side].title}</div>
        <div class='panel-body' style='padding: 8px;'>
          {layouts[side].items.map(item => (
            <div key={item.requestKey} class='mm-item clearfix' data-key={item.requestKey} onClick={this.onItemClick}>
              <div class='pull-left mm-icon'>
                <span class={`sprite ${item.iconName}`} />
                {/* <img alt='64x64' class='img-circle' src='data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PCEtLQpTb3VyY2UgVVJMOiBob2xkZXIuanMvNjR4NjQKQ3JlYXRlZCB3aXRoIEhvbGRlci5qcyAyLjYuMC4KTGVhcm4gbW9yZSBhdCBodHRwOi8vaG9sZGVyanMuY29tCihjKSAyMDEyLTIwMTUgSXZhbiBNYWxvcGluc2t5IC0gaHR0cDovL2ltc2t5LmNvCi0tPjxkZWZzPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+PCFbQ0RBVEFbI2hvbGRlcl8xNWZlM2Q2MTM3YSB0ZXh0IHsgZmlsbDojQUFBQUFBO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1mYW1pbHk6QXJpYWwsIEhlbHZldGljYSwgT3BlbiBTYW5zLCBzYW5zLXNlcmlmLCBtb25vc3BhY2U7Zm9udC1zaXplOjEwcHQgfSBdXT48L3N0eWxlPjwvZGVmcz48ZyBpZD0iaG9sZGVyXzE1ZmUzZDYxMzdhIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNFRUVFRUUiLz48Zz48dGV4dCB4PSIxMy40Njg3NSIgeT0iMzYuNDUzMTI1Ij42NHg2NDwvdGV4dD48L2c+PC9nPjwvc3ZnPg==' style='width: 48px; height: 48px;' /> */}
              </div>
              <div class='pull-left mm-item-title'>
                <h4 class='media-heading'>{item.menuTitle}</h4>
              </div>
              <div class='media-right pull-right hidden'>
                <img alt='64x64' class='media-object' src='data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PCEtLQpTb3VyY2UgVVJMOiBob2xkZXIuanMvNjR4NjQKQ3JlYXRlZCB3aXRoIEhvbGRlci5qcyAyLjYuMC4KTGVhcm4gbW9yZSBhdCBodHRwOi8vaG9sZGVyanMuY29tCihjKSAyMDEyLTIwMTUgSXZhbiBNYWxvcGluc2t5IC0gaHR0cDovL2ltc2t5LmNvCi0tPjxkZWZzPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+PCFbQ0RBVEFbI2hvbGRlcl8xNWZlM2Q2MDY0OCB0ZXh0IHsgZmlsbDojQUFBQUFBO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1mYW1pbHk6QXJpYWwsIEhlbHZldGljYSwgT3BlbiBTYW5zLCBzYW5zLXNlcmlmLCBtb25vc3BhY2U7Zm9udC1zaXplOjEwcHQgfSBdXT48L3N0eWxlPjwvZGVmcz48ZyBpZD0iaG9sZGVyXzE1ZmUzZDYwNjQ4Ij48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNFRUVFRUUiLz48Zz48dGV4dCB4PSIxMy40Njg3NSIgeT0iMzYuNDUzMTI1Ij42NHg2NDwvdGV4dD48L2c+PC9nPjwvc3ZnPg==' style='width: 48px; height: 48px;' />
              </div>
            </div>
          ))}
        </div>
      </div>

    ));

    return (
      <div class='mainmenu-view'>
        <Navbar
          theme='inverse'
          brand={brand}
          menuType={0}
        />
        <div id='page-content' class='container-fluid' style={pageContentStyles}>
          <div class='row'>
            {panels}
          </div>
        </div>
        <Navbar
          items={bottomNavbarItems}
          menuType={1}
          position='bottom'
          onNavbarClick={this.onNavbarClick}
        />
      </div>
    );
  }

  onNavbarClick = (ev) => {
    ev.preventDefault();

    // log
    console.log(ev.currentTarget.getAttribute('data-event'));
    // console.log(ev.currentTarget.dataset.event);
  }

  onItemClick = (ev) => {
    let reqKey = ev.currentTarget.getAttribute('data-key');

    // get layout
    let layout = getLayoutBy(this.props.layouts, 'requestKey', reqKey);

    // log
    console.log(layout);

    // route prefix (default progeny)
    let routePrefix = 'p/';

    // route suffix
    let routeSuffix = '';

    // has card
    if (reqKey.toLowerCase().indexOf('card') >= 0) {

      // update routePrefix
      routePrefix = 'c/';

      // update suffix
      routeSuffix = '/last';
    } else {

      // get update mode
      let updateMode = getProp(layout, ['updateMode'], 0);

      // if worktask
      if (updateMode) {

        // update routePrefix
        routePrefix = 'w/';
      }
    }

    // offline mode
    // if (session.get('app', 'connection') > Const.NET_CONNECTED) {
    if (this.props.connection > Const.NET_CONNECTED) {

      // validate offline key
      if (!layout.offlinekey) {
        return console.log(`${layout.requestKey} not available in offline mode`);

        // // labels
        // let t1 = session.get('sp_lang', 'SP_Toast7') || Language.toast['7'][this.lang];

        // // toast and resume
        // return $.publish('smartpigs', ['toast', { type: 2, message: t1 }]);
      }
    }

    // navigate action
    this.props.navigate(routePrefix + reqKey + routeSuffix);
  }
};

const mapStateToProps = state => ({
  lang: state.ui.lang,
  layouts: state.layouts,
  connection: state.ui.connection
});

const mapDispatchToProps = dispatch => ({
  navigate: (path) => {

    // TODO: improve navbar click handling
    dispatch(navigateAction(path));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(MainmenuPage);
