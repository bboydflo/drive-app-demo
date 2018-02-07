import { h, Component } from 'preact';
import Navbar from './navbar';
import Const from '../modules/constants';

// export default (Backbone, broker, dataApi, loginApi, utils, session) => {

class SimpleSpreadPage extends Component {

  state = {
    lang: session.get('settings', 'lang'),
    isLoading: true,
    showModal: false,
    error: {
      visible: false,
      title: '',
      message: ''
    },
    layout: null,
    rows: null,
    animals: null
  };

  render (props, state) {
    if (state.isLoading) {
      return <p>loading...</p>;
    }

    let { lang, rows } = state;
    let { layout } = props;

    // log
    console.log(layout, rows);

    let brand = <p class='navbar-text'>Entry</p>;

    let pageContentStyles = 'padding-bottom: 39px'; // 51 - 12

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
      id: 'menu-add-row',
      data: false,
      label: 'Add row',
      visible: true,
      icon: 'glyphicon glyphicon-plus',
      // color: '#222222',
      spanClass: '',
      showLabel: true,
      event: 'add-row'
    }, {
      enabled: true,
      id: 'menu-filter',
      data: false,
      label: 'Filter',
      visible: true,
      icon: 'glyphicon glyphicon-filter',
      spanClass: '',
      // color: '#222222',
      showLabel: true,
      event: 'logout'
    }];

    return (
      <div class='simple-spread-view'>
        <Navbar
          theme='inverse'
          brand={brand}
          menuType={0}
        />
        <div id='page-content' class='container-fluid' style={pageContentStyles}>
          <div class='row'>
            {rows.map((row, idx) => (
              <div key={row.id} class='spread-line'>
                <div class='sl-sidebar'>
                  <span class='badge'>{idx + 1}</span>
                  <span class='ch'>
                    <i class='fa fa-square-o' aria-hidden='true' />
                  </span>
                </div>
                <div class='sl-main-content'>
                  <div class='wrapper'>
                    <div class='lc-body-title'>
                      <address style='margin-bottom: 0;'>
                        {JSON.stringify(row.data)}
                        {/* <strong> Full Name:</strong>Florin<br />
                        <a href='mailto:#'>first.last@example.com</a><br />
                        <strong>Some very long key</strong> value pairs */}
                      </address>
                    </div>
                    <div class='lc-footer clearfix'>
                      <button type='button' class='btn btn-default btn-blockd pull-right'><span class='glyphicon glyphicon-resize-vertical' /> Edit</button>
                      {/*
                      <button type='button' class='btn btn-default'><span class='glyphicon glyphicon-trash' /> Remove</button>
                      <button type='button' class='btn btn-default'><span class='glyphicon glyphicon-resize-vertical' /> Edit</button>
                      */}
                    </div>
                  </div>
                  {row.removable &&
                    <button type='button' class='close' aria-label='Close'>
                      <span aria-hidden='true'>&times;</span>
                    </button>
                  }
                </div>
              </div>
            ))}
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

  componentDidMount () {
    let { layout } = this.props;
    const isOnline = session.get('app', 'connection') === Const.NET_CONNECTED;

    // check data src
    if (isOnline && !layout.database) {
      const poc = session.get('settings', 'poc');
      const serverAddress = session.get('device', Const.SERVER_URL) || '/';
      let url = `${serverAddress}get.html?${session.get('layouts', 'sessionKey')}?${layout.requestKey}`;

      if (poc) {
        url = url.replace(/\?/g, '/');
      }

      // log
      // console.log(url);

      // fetch data from the server
      return dataApi
        .fetchServer(url, layout)
        .then(serverResponse => {
          let response = dataApi.parseServerResponse(serverResponse);

          // something went wrong
          if (response instanceof Error) throw response;

          // TODO: check for animals and new layout in the response
          let normalizedRows = dataApi.normalizeRows(response.tr, 0, layout.requestKey);

          // log
          // console.log(normalizedRows);

          // update state
          this.setState({
            isLoading: false,
            rows: normalizedRows
          });
        })
        .catch(err => {
          console.log(err);
        });
    }

    // log
    console.log(this.props, this.state);

    setTimeout(() => {
      this.setState({isLoading: false});
    }, 2500);
  }

  onNavbarClick = (ev) => {
    ev.preventDefault();

    // log
    console.log(ev.currentTarget.getAttribute('data-event'));
    // console.log(ev.currentTarget.dataset.event);
  }
};

export default SimpleSpreadPage;
