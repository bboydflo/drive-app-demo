import { h } from 'preact';

import ToggleBtn from './HeaderToggleBtn';
// import Brand from './Brand';

// menubar factory
export default () => {

  // exports a component
  return (props) => {

    /*var userLabel, credentials, // databaseName,
      menuItems = [];

    // check type
    if (typeof type == 'undefined') {

      // update type
      type = this.model.get('type');
    }

    // update language
    this.lang = lang || session.get('settings', 'lang');

    // back label
    var backLabel = session.get('sp_lang', 'SP_Back') || Language.button.back[this.lang];

    // labels
    var u6 = session.get('sp_lang', 'SP_SettingsModalTitle') || Language.settingsModal.title[this.lang];
    var u7 = session.get('sp_lang', 'SP_MenubarLogout') || Language.menubar.logout[this.lang];
    var u8 = session.get('sp_lang', 'SP_MenubarOffline') || Language.menubar.offline[this.lang];
    var u9 = session.get('sp_lang', 'SP_MenubarOnline') || Language.menubar.online[this.lang];
    var v0 = session.get('sp_lang', 'SP_MenubarLocation') || Language.menubar.location[this.lang];
    // var v1 = session.get( 'sp_lang', 'SP_MenubarLocation') || Language.button.refresh[this.lang];
    var v1 = Language.button.refresh[this.lang];
    */

    let hidden = false;

    // brand
    let brand = 'smartpigs';

    // get type
    let { type = 0 } = props;

    // get version
    let version = '12.04.87';

    // get database name
    let databaseName = 'Hauskov';

    switch (type) {
    case 0:
      // brand = <a class="navbar-brand" href="#">SmartPigs <code> {version} </code></a>;
      brand = <p class="navbar-text">SmartPigs <code> {version}</code></p>;
      break;

    case 1:
      brand = <a class="navbar-brand" href="#">SmartPigs - {databaseName} </a>;
      break;

    case 2:
      brand = (
        <div class="alternate-brand">
          <label> {databaseName} </label>
          <input type="search" class="form-control" name="location" id="location" />
        </div>
      );
      break;
    case 3:
      brand = (
        <div class="alternate-brand">
          <div class="form-inline" style="overflow: hidden;">
            <div class="form-group browse-sow" data-direction="<">
              <span class="glyphicon glyphicon-chevron-left nav-glyph" aria-hidden="true"></span>
            </div>
            <div class="form-group form-group-location">
              <input type="text" class="form-control pull-left" id="location" value="" />
            </div>
            <div class="form-group browse-sow" data-direction=">">
              <span class="glyphicon glyphicon-chevron-right nav-glyph" aria-hidden="true"></span>
            </div>
          </div>
        </div>
      );
      break;
    case 4:
    case 5:
    case 6:
      brand = <a class="navbar-brand" href="#">SmartPigs</a>;
      break;
    case 7:
      brand = <a class="navbar-brand" href="#">SmartPigs <code>{version}</code></a>;
      break;
    case 8:
      brand = <a class="navbar-brand" href="#">Whiteboard</a>;
      break;
    }

    // define item label
    // var itemLabel = <p style="color: red;">florincosmin</p>;
    let itemLabel = 'florincosmin';

    let menuItems = [{
      id: 'menu-settings',
      data: false,
      label: itemLabel,
      visible: true,
      glyphicon: 'glyphicon glyphicon-cog'
    }];

    // build list items (if any)
    let listItems = menuItems.map((item) =>
      <li class="menu-item">
        <a href="#" class="event-item" id={item.id}>
          <span class={item.glyphicon}></span>&nbsp;{item.label}
        </a>
      </li>
    );

    return (
      <div>
        <div class='navbar-header'>
          <ToggleBtn hidden={hidden} />
          {/* <Brand value={ brand } /> */}
          { brand }
        </div>
        <div class='collapse navbar-collapse navbar-ex1-collapse'>
          <ul class="nav navbar-nav navbar-right {hidden ? 'hidden' : ''}">
            {listItems}
          </ul>
        </div>
      </div>
    );
  };
};
