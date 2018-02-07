'use strict';

// lodash functions
import { trim, truncate, capitalize } from 'lodash';

// menubar factory
export default ($, Layout, template, Language, session, isAndroid) => {

  // return backbone view factory
  return class V extends Layout {

    constructor(o) {
      super(o);

      // remove wrapper div
      this.el = false;

      // define view template
      this.template = template;

      // define view events
      this.events = {
        'click .event-item': 'menuEvent',
        'click .browse-sow': 'browse',
        'focus #location': 'clearLocation',
        'keyup #location': 'changeLocation',
        'blur #location': 'restoreLocation'
      };
    }

    initialize() {

      // listen for 'update-menu' events
      $.subscribe( 'update-menu', this.onUpdateMenu.bind(this) );

      // listen for 'language-change' events
      this.on( 'language-change', this.languageChange );

      // auto render
      this.render();
    }

    // on 'language-change'
    languageChange( lang ) {

      // force render with new language
      this.update( undefined, lang );
    }

    update( type, lang ) {
      var userLabel, credentials, databaseName,
        menuItems = [];

      // check type
      if ( typeof type == 'undefined' ) {

        // update type
        type = this.model.get( 'type' );
      }

      // update language
      this.lang = lang || session.get( 'settings', 'lang' );

      // back label
      var backLabel = session.get( 'sp_lang', 'SP_Back') || Language.button.back[this.lang];

      // labels
      var u6 = session.get( 'sp_lang', 'SP_SettingsModalTitle') || Language.settingsModal.title[this.lang];
      var u7 = session.get( 'sp_lang', 'SP_MenubarLogout') || Language.menubar.logout[this.lang];
      var u8 = session.get( 'sp_lang', 'SP_MenubarOffline') || Language.menubar.offline[this.lang];
      var u9 = session.get( 'sp_lang', 'SP_MenubarOnline') || Language.menubar.online[this.lang];
      var v0 = session.get( 'sp_lang', 'SP_MenubarLocation') || Language.menubar.location[this.lang];
      // var v1 = session.get( 'sp_lang', 'SP_MenubarLocation') || Language.button.refresh[this.lang];
      var v1 = Language.button.refresh[this.lang];

      switch( type ) {

      // #index view
      case 0:
        this.model.set({
          value: '',
          type: type,
          hidden: false,
          brand: '<a class="navbar-brand" href="#">SmartPigs <code>' + session.get( 'app', 'version' ) + '</code></a>',
          items: [{
            id: 'menu-settings',
            data: false,
            label: u6,
            visible: true,
            glyphicon: 'glyphicon glyphicon-cog'
          }]
        });
        break;

      // #mainmenu view
      case 1:

        // get info
        credentials = session.get( 'cache', 'credentials' );
        userLabel = u7 + '&nbsp;<strong style="color: #d6e9c6 !important;">' + credentials.user + '</strong>';
        databaseName = capitalize( credentials.database );

        // set menu items
        menuItems.push({
          id: 'menu-back',
          data: false,
          visible: true,
          glyphicon: 'glyphicon glyphicon-arrow-left',
          label: backLabel
        });

        // check if android smartpigs
        if ( isAndroid ) {

          // insert bluetooth item
          menuItems.push({
            visible: true,
            id: 'bluetooth',
            glyphicon: 'agrosoft-bluetooth',
            label: 'Bluetooth'
          });
        }

        // update database name
        if ( databaseName.length > 10 ) {

          // truncate database string to contain maximum 10 characters
          databaseName = truncate( databaseName, {'length': 10} );
        }

        // check connection state
        if ( this.model.get('connection') == 1 ) {
          menuItems.push({
            visible: true,
            id: 'toggle-connection',
            glyphicon: 'glyphicon glyphicon-off ',
            label: u8
          }, {
            visible: true,
            id: 'logout',
            glyphicon: 'glyphicon glyphicon-log-out ',
            label: userLabel
          });
        } else {
          menuItems.push({
            id: 'toggle-connection',
            glyphicon: 'glyphicon glyphicon-globe ',
            label: u9,
            visible: true
          });
        }

        // update model
        this.model.set({
          value: '',
          type: type,
          hidden: false,
          brand: '<a class="navbar-brand" href="#">SmartPigs - ' + databaseName + '</a>',
          items: menuItems
        });
        break;

      // #progeny view
      case 2:
        menuItems.push({
          visible: true,
          id: 'menu-back',
          glyphicon: 'glyphicon glyphicon-arrow-left',
          label: backLabel
        });

        // check if android smartpigs
        if ( isAndroid ) {

          // insert bluetooth item
          menuItems.push({
            visible: true,
            id: 'bluetooth',
            glyphicon: 'agrosoft-bluetooth',
            label: 'Bluetooth'
          });
        }

        this.model.set({
          value: '',
          type: type,
          hidden: false,
          brand: '<div class="alternate-brand"><label>' + v0 + ':&nbsp;</label>' +
                '<input type="search" class="form-control" name="location" id="location"></div>',
          /*brand: '<p class="navbar-text">' + Language.menubar.location[this.lang] + ':&nbsp;</p>' +
                '<form class="navbar-form navbar-left" role="search">' +
                '<div class="form-group">' +
                '<button type="submit" class="btn btn-default"><span class="glyphicon glyphicon-arrow-left"></span></button>' +
                '<input type="text" class="form-control" placeholder="Search">' +
                '<button type="submit" class="btn btn-default"><span class="glyphicon glyphicon-arrow-right"></span></button>' +
                '</div></form>',*/
          items: menuItems
        });
        break;

      // sowcard view
      case 3:
        menuItems.push({
          visible: true,
          id: 'menu-back',
          glyphicon: 'glyphicon glyphicon-arrow-left',
          label: backLabel
        });

        // check if android smartpigs
        if ( isAndroid ) {

          // insert bluetooth item
          menuItems.push({
            visible: true,
            id: 'bluetooth',
            glyphicon: 'agrosoft-bluetooth',
            label: 'Bluetooth'
          });
        }

        this.model.set({
          type: type,
          hidden: false,
          brand:
            '<div class="alternate-brand">' +
              '<div class="form-inline" style="overflow: hidden;">' +
                '<div class="form-group browse-sow" data-direction="<">' +
                  ' <span class="glyphicon glyphicon-chevron-left nav-glyph" aria-hidden="true"></span>' +
                '</div>' +
                '<div class="form-group form-group-location">' +
                  '<input type="text" class="form-control pull-left" id="location" value="' + this.model.get( 'value' ) + '">' +
                '</div>' +
                '<div class="form-group browse-sow" data-direction=">">' +
                  ' <span class="glyphicon glyphicon-chevron-right nav-glyph" aria-hidden="true"></span>' +
                '</div>' +
              '</div>' +
            '</div>',
          items: menuItems
        });
        break;

      //
      case 4:
        menuItems.push({
          visible: true,
          id: 'menu-back',
          glyphicon: 'glyphicon glyphicon-arrow-left',
          label: backLabel
        });

        // check if android smartpigs
        if ( isAndroid ) {

          // insert bluetooth item
          menuItems.push({
            visible: true,
            id: 'bluetooth',
            glyphicon: 'agrosoft-bluetooth',
            label: 'Bluetooth'
          });
        }

        this.model.set({
          value: '',
          type: type,
          hidden: false,
          brand: '<a class="navbar-brand" href="#">SmartPigs</a>',
          items: menuItems
        });
        break;

      case 5:
        menuItems.push({
          visible: true,
          id: 'menu-back',
          glyphicon: 'glyphicon glyphicon-arrow-left',
          label: backLabel
        });

        // update model
        this.model.set({
          value: '',
          type: type,
          hidden: false,
          brand: '<a class="navbar-brand" href="#">SmartPigs</a>',
          items: menuItems
        });
        break;
      case 6:
        menuItems.push({
          visible: true,
          id: 'restore',
          glyphicon: 'glyphicon glyphicon-refresh',
          label: 'Restore'
        });

        // update model
        this.model.set({
          value: '',
          type: type,
          hidden: false,
          brand: '<a class="navbar-brand" href="#">SmartPigs</a>',
          items: menuItems
        });
        break;

      // whiteboard#index view
      case 7:
        this.model.set({
          value: '',
          type: type,
          hidden: false,
          brand: '<a class="navbar-brand" href="#">SmartPigs <code>' + session.get( 'app', 'version' ) + '</code></a>',
          items: []
        });
        break;

      // whiteboard#whiteboard view
      case 8:

        // get info
        credentials = session.get( 'cache', 'credentials' );
        userLabel = u7 + '&nbsp;<strong style="color: #d6e9c6 !important;">' + credentials.user + '</strong>';

        // set menu items
        menuItems.push({
          id: 'refresh-whiteboard',
          data: false,
          visible: true,
          glyphicon: 'glyphicon glyphicon-refresh',
          label: capitalize(v1)
        });

        // insert item
        menuItems.push({
          visible: true,
          id: 'logout',
          glyphicon: 'glyphicon glyphicon-log-out ',
          label: userLabel
        });

        // update model
        this.model.set({
          value: '',
          type: type,
          hidden: false,
          brand: '<a class="navbar-brand" href="#">Whiteboard</a>',
          items: menuItems
        });
        break;
      }

      // render
      this.render();
    }

    browse( event ) {

      // prevent default event and supress event propagation
      event.preventDefault();
      event.stopPropagation();

      if ( this.model.get('listen') ) {

        // get current id
        var value = this.$( '#location' ).val();

        // get current direction
        var direction = this.$( event.currentTarget ).data( 'direction' );

        // publish event
        $.publish( 'browse', [direction, value] );
      }
    }

    onUpdateMenu( ev, type, lang ) {

      // update menu type
      this.update( type, lang );
    }

    menuEvent( event ) {

      // default delay
      var delay = 0;

      // get event which is the same as the id of the currentTarget element that was clicked
      var ev = this.$( event.currentTarget ).attr( 'id' );

      // prevent default event and stop event propagation
      event.preventDefault();

      // if view responds to click events
      if ( this.model.get( 'listen' ) ) {

        // menubar is collapsed
        if ( this.$('.navbar-collapse').hasClass('in') ) {

          // update delay
          delay = 250;

          // cache element
          var $navbarCollapse = this.$( '.navbar-collapse' );

          // apply collapse plugin
          $navbarCollapse.each(function () {
            $( this ).collapse( 'hide' );
          });
        }

        // trigger event with delay
        setTimeout(function() {

          // publish event
          $.publish( ev, [] );
        }.bind(this), delay);
      }
    }

    clearLocation( event ) {

      // get element
      var el = this.$( event.currentTarget );

      // clear value
      el.val( '' );

      // resume
      return;
    }

    changeLocation( event ) {

      // prevent default event and stop event propagation
      event.preventDefault();
      event.stopPropagation();

      // target element
      var $targetEl = this.$( event.currentTarget );

      // get model listen properties
      if ( this.model.get('listen') ) {

        // get keycode
        var key = event.keyCode || event.which;

        // get value
        // var value = trim ( this.$( event.currentTarget ).val().toLowerCase() );
        var value = trim( $targetEl.val().toLowerCase() );

        // if keypress = enter
        if ( parseInt(key) !== 13 ) {

          // filter location
          $.publish( 'location-filter', [value] );

          // resume
          return true;
        }

        // check value
        if ( !value ) {

          // resume
          return true;
        }

        // remove input focus
        // $( this ).blur();
        $targetEl.blur();

        // trigger browse
        $.publish( 'browse', ['=', value] );
      }
    }

    restoreLocation( event ) {

      // get element
      var el = this.$( event.currentTarget );

      // update value on blur
      el.val( this.model.get( 'value' ) );

      // resume
      return;
    }

    updateConnection( connection ) {

      // update android status as well
      $.publish( 'controls', ['connection', connection] );
    }
  };
};
