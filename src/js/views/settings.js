'use strict';

// libs
import getProp from 'get-prop';

// lodash helpers
import { assign, throttle, capitalize } from 'lodash';

// keeping state about which panel is
// collapsed. defaults to second panel
var collapsed = [false, true];

// exports
export default ($, Backbone, Layout, Const, Language, android, Templates, session) => {

  // throttled listener
  // http://devdocs.io/lodash~4/index#throttle
  const onMakeDiscoverable = throttle(function(){

    // trigger native method defined in JavascriptInterface
    Android.makeDiscoverable();
  }, 500);

  // throttled listener
  const onToggleBluetooth = throttle(function(){

    // trigger native method defined in JavascriptInterface
    Android.toggleBluetooth();
  }, 500);

  // throttled listener
  const onToggleConnection = throttle(function( ev ){

    // get current element
    var $el = this.$( ev.currentTarget );

    // get connnection type
    var type = parseInt( $el.data('type'), 10 );

    // trigger native method defined in JavascriptInterface
    Android.toggleConnection( type );
  }, 500);

  // throttled listener
  const onAdjustRange = throttle(function( ev ) {
    var $el = this.$( ev.currentTarget );

    // device and language
    var device = session.get( 'device' );
    var lang = session.get( 'settings', 'lang' );

    // validate device
    if ( !device || !$.isPlainObject(device) || $.isEmptyObject(device) ) return;

    // get device type
    var deviceType = getProp( device, [Const.DEVICE_TYPE], -1 );

    // ranges
    var range, minRange, maxRange, singleRange, multiRange, connectionLabel;

    // check against min and max range
    switch( deviceType ) {
    case 0:
    case 2:
      minRange = Const.TSL_MIN_RANGE;
      maxRange = Const.TSL_MAX_RANGE;

      // get device current min and max range
      singleRange = device[Const.TSL_SINGLE_RANGE];
      multiRange  = device[Const.TSL_MULTI_RANGE];

      // get connection label
      connectionLabel = Const.BT_CONNECTION;
      break;
    case 1:
      minRange = Const.KT_MIN_RANGE;
      maxRange = Const.KT_MAX_RANGE;

      // get device current min and max range
      singleRange = device[Const.KT_SINGLE_RANGE];
      multiRange  = device[Const.KT_MULTI_RANGE];

      // get connection label
      connectionLabel = Const.BT_CONNECTION;
      break;
    case 6:
    case 8:
      minRange = Const.BH9_MIN_RANGE;
      maxRange = Const.BH9_MAX_RANGE;

      // get device current min and max range
      singleRange = device[Const.BH9_SINGLE_RANGE];
      multiRange  = device[Const.BH9_MULTI_RANGE];

      // get connection label
      connectionLabel = Const.UHF_CONNECTION;
      break;
    }

    // check connection
    if( !getProp(device, [connectionLabel]) || !getProp(device, [Const.BLUETOOTH]) ) {

      // toast
      var t0 = session.get( 'sp_lang', 'SP_Toast16') || Language.toast[16][lang];

      // toast - cannot update range when no connection or bluetooth is disabled
      return $.publish( 'toast', [2, t0] );
    }

    // validate $el
    if ( !$el.length ) {

      // toast
      return $.publish( 'toast', [1, 'adjust range -> no element'] );
    }

    // get mode and direction
    var mode      = $el.data( 'mode' );
    var direction = $el.data( 'controller' );

    // check direction
    switch ( direction ) {
    case 'less':

      // check mode
      if ( mode == Const.SINGLE_MODE ) {

        // check if valid range
        if ( singleRange > minRange ) {

          // decrement current range
          range = singleRange - 1;
        } else {

          // toast and resume
          return $.publish( 'toast', [ 2, 'MINIMUM RANGE LIMIT!' ] );
        }
      } else {

        // check if valid range
        if ( multiRange > singleRange ) {

          // decrement current range
          range = multiRange - 1;
        } else {

          // toast
          return $.publish( 'toast', [ 2, 'MINIMUM RANGE LIMIT!' ] );
        }
      }
      break;
    case 'more':

      // check mode
      if ( mode == Const.SINGLE_MODE ) {

        // check if valid range
        if ( singleRange < multiRange ) {

          // increment current range
          range = singleRange + 1;
        } else {

          // toast
          return $.publish( 'toast', [ 2, 'MAXIMUM RANGE LIMIT!' ] );
        }
      } else {

        // check if valid range
        if ( multiRange < maxRange ) {

          // increment current range
          range = multiRange + 1;
        } else {

          // toast
          return $.publish( 'toast', [ 2, 'MAXIMUM RANGE LIMIT!' ] );
        }
      }
      break;
    default:
      break;
    }

    // set mode and range
    android.setModeRange( mode, range );
  }, 500);

  // throttled listener
  const adjustTagLength = throttle(function( ev ) {

    // get element
    var $el = $( ev.currentTarget );

    // get device
    var device = session.get( 'device' );

    // validate device -> fail early
    if ( !device || !$.isPlainObject(device) || $.isEmptyObject(device) ) return;

    // validate $el
    if ( !$el.length ) {

      // toast
      return $.publish( 'toast', [1, 'adjust range -> no element'] );
    }

    // get tag length
    var tagLength = device[Const.TAG_LENGTH_KEY];

    // get direction
    var direction = $el.data( 'controller' );

    // check direction
    switch ( direction ) {
    case 'less':

      // enforce minimum limit
      if ( tagLength > 1 ) {

        // update tag length
        tagLength -= 1;
      }
      break;
    case 'more':

      // enforce minimum limit
      if ( tagLength < 15 ) {

        // update tag length
        tagLength += 1;
      }
      break;
    default:
      break;
    }

    // update tag length
    android.setTagLength( tagLength );
  }, 500);

  // throttled listener
  const onRestartService = throttle(function() {

    // update tag length
    android.restartService();
  }, 500);

  // throttled listener
  const updateApk = throttle(function(ev) {

    // check if on smartpigs
    if ( Modernizr.smartpigs ) {

      // prevent default event
      ev.preventDefault();

      // get server address
      var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

      // update tag length
      android.updateApk( server_address + 'sPigs.apk' );

      // resume
      return false;
    }
  }, 500);

  const onToggleErrors = throttle(function() {

    // toggle errors
    Android.toggleErrorToast();
  });

  // return settings view
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // disable view wrapper
        el: false,

        // define view template
        template: Templates.panel,

        /*
          default render mode
          0 -> render all
          1 -> render top settings
          2 -> render bottom settings
        */
        renderMode: 0,

        // events hash
        events: {
          'change .selectLang': 'onLanguageChange',
          'click .btn-reset-sp': 'onResetSettings',
          'click .btn-test-db': 'onTestDb',
          'click .btn-toggle-errors': 'onToggleErrors',
          'click .btn-bluetooth': 'onToggleBluetooth',
          'click .btn-reader': 'onToggleConnection',
          'click .btn-discover': 'onMakeDiscoverable',
          'click .btn-service': 'onRestartService',
          'click .range': 'onAdjustRange',
          'click .tag-length': 'adjustTagLength',
          // 'click .btn-update-sp': 'updateApk',
          'shown.bs.collapse': 'onCollapseShown'
        },

        // throttled listeners
        onAdjustRange,
        adjustTagLength,
        updateApk,
        onToggleBluetooth,
        onMakeDiscoverable,
        onRestartService,
        onToggleConnection,
        onToggleErrors,
      }, o));
    }

    // view constructor
    initialize( options ) {

      // update render mode
      this.renderMode = getProp( options, ['renderMode'], 0 );

      // listen for 'back' events
      this.on( 'back', this.onBack, this );

      // listen to 'settings' events
      $.subscribe( 'settings', this.render.bind(this) );
    }

    isAndroid() {

      // resume
      return android ? true : false;
    }

    afterRender() {

      // init android
      $.publish( 'init-android' );
    }

    serialize() {
      var device, dType, dModel, dVersion;

      // define items
      var panels       = [];
      var generalItems = [];
      var androidItems = [];

      // get view language
      var lang = this.lang;

      // toast
      var t0 = session.get( 'sp_lang', 'SP_SettingsModalItem0') || Language.settingsModal.item0[lang];
      var t1 = session.get( 'sp_lang', 'SP_ButtonUpdate') || Language.button.update[lang];
      var t2 = session.get( 'sp_lang', 'SP_ButtonDownload') || Language.button.download[lang];
      var t3 = session.get( 'sp_lang', 'SP_ButtonReset') || Language.button.reset[lang];
      var t4 = session.get( 'sp_lang', 'SP_SettingsModalPanel1') || Language.settingsModal.panel1[lang];

      // check if on android
      var isAndroid = this.isAndroid();

      // check render mode
      // if ( this.renderMode === 0 || this.renderMode == 1 ) {
      if ( this.renderMode < 2 ) {

        // insert version item
        generalItems.push({
          itemClass: 'sp-version',
          itemLabel: t0,
          itemContent: session.get( 'app', 'version' )
        });

        // real link:
        var realDownloadLink = isAndroid ? session.get( 'device', Const.SERVER_URL ) : '/';

        // update real download link
        realDownloadLink += 'sPigs.apk';

        // insert update item
        generalItems.push({
          itemClass: 'sp-timeout',
          itemLabel: capitalize( t1 ),
          itemContent: '<a href="' + realDownloadLink + '" type="button" class="btn btn-primary btn-update-sp">' +
                      '<span class="glyphicon glyphicon-download-alt"></span> ' +
                      capitalize( t2 ) +
                      '</a>'
        });

        // insert reset item
        generalItems.push({
          itemClass: 'sp-timeout',
          itemLabel: t3,
          itemContent: '<button type="button" class="btn btn-danger btn-reset-sp"><span class="glyphicon glyphicon-cog"></span> '+ Language.button.reset[lang] +'</button>'
        });

        // insert 'test database' item
        generalItems.push({
          itemClass: 'sp-timeout',
          itemLabel: 'Database',
          itemContent: '<button type="button" class="btn btn-default btn-test-db"><span class="glyphicon glyphicon-hdd"></span> Test DB</button>'
        });
      }

      // on android with 'android' render mode ( 0 | 2 )
      // if ( mobile && (this.renderMode === 0 || this.renderMode == 2) ) {
      if ( isAndroid && this.renderMode % 2 === 0 ) {
        device = session.get( 'device' );

        // validate device. resume early
        if ( !device || !$.isPlainObject(device) || $.isEmptyObject(device) ) return;

        // get device properties
        dVersion = getProp( device, [Const.DEVICE_VERSION], -1 );
        dModel   = getProp( device, [Const.DEVICE_MODEL], '' );
        dType    = getProp( device, [Const.DEVICE_TYPE], -1 );

        // insert device-version item
        androidItems.push({
          itemClass: 'sp-timeout',
          itemLabel: 'Version',
          itemContent: dVersion
        });

        // insert device-model item
        androidItems.push({
          itemClass: 'sp-timeout',
          itemLabel: 'Model',
          itemContent: dModel
        });

        // render show error messages
        this.renderShowErrorToggle( androidItems, device );

        switch( dType ) {
        case -1:
          this.renderDeviceType( androidItems, 'Default' );
          this.renderConnectButton( androidItems, device, 2 );
          this.renderTagLength( androidItems, device );
          break;
        // 0 - TSL
        case 0:
          this.renderDeviceType( androidItems, 'TSL' );
          this.renderConnectButton( androidItems, device, 2 );
          this.renderRangeSettings( androidItems, device );
          break;
        // 1 - KT45 (HF)
        case 1:
          this.renderDeviceType( androidItems, 'Destron' );
          this.renderConnectButton( androidItems, device, 2 );
          this.renderTagLength( androidItems, device );
          break;
        // 2 - KT45 (LF)
        case 2:
          this.renderDeviceType( androidItems, 'TSL' );
          this.renderConnectButton( androidItems, device, 2 );
          this.renderRangeSettings( androidItems, device );
          break;
        // 3 - Destron
        case  3:
          this.renderDeviceType( androidItems, 'Destron' );
          this.renderConnectButton( androidItems, device, 2 );
          this.renderTagLength( androidItems, device );
          break;
        // 4 - Nautiz X4
        case 4:
          this.renderDeviceType( androidItems, 'Nautiz X4' );
          this.renderConnectButton( androidItems, device, 2 );
          this.renderTagLength( androidItems, device );
          break;
        // 5 - Agrident
        case 5:
          this.renderDeviceType( androidItems, 'Agrident' );
          this.renderMakeVisible( androidItems );
          this.renderRestartService( androidItems, device );
          this.renderConnectionStatus( androidItems, device );
          this.renderTagLength( androidItems, device );
          break;
        // 6 - BH9-UHFRFID
        case 6:
          this.renderDeviceType( androidItems, 'BH9-UHFRFID' );
          this.renderTagLength( androidItems, device );
          this.renderConnectButton( androidItems, device, 2 );
          this.renderRangeSettings( androidItems, device );
          break;
        // 7 - BH9-LFRFID
        case 7:
          this.renderDeviceType( androidItems, 'BH9-LFRFID' );
          this.renderTagLength( androidItems, device );
          /*this.renderConnectButton( androidItems, device, 2 );
          this.renderRangeSettings( androidItems, device );*/
          break;
        // 8 - BH9
        case 8:
          this.renderConnectButton( androidItems, device, 0 );
          this.renderTagLength( androidItems, device );
          this.renderConnectButton( androidItems, device, 1 );
          this.renderRangeSettings( androidItems, device );
          break;
        }
      }

      // check render mode
      switch( this.renderMode ) {

      // render all settings
      case 0:

        // local vars
        panels.push({
          collapsed: collapsed[ 0 ],
          panelGroupId: 'accordion',
          panelId: 'panel1',
          glyphicon: 'glyphicon-check',
          panelTitle: t4,
          item: generalItems
        });

        // on android
        if ( isAndroid ) {

          // update panel items
          panels.push({
            collapsed: collapsed[ 1 ],
            panelGroupId: 'accordion',
            panelId: 'panel2',
            glyphicon: 'glyphicon-phone',
            panelTitle: 'Android',
            item: androidItems
          });
        }
        break;

      // render general settings only
      case 1:

        // update collapsed settings
        collapsed = [false, true];

        // local vars
        panels.push({
          collapsed: false,
          panelGroupId: 'accordion',
          panelId: 'panel1',
          glyphicon: 'glyphicon-check',
          panelTitle: t4,
          item: generalItems
        });
        break;

      // render android settings only
      case 2:

        // not on android
        if ( !isAndroid ) {

          // skip
          break;
        }

        // update collapsed settings
        collapsed = [true, false];

        // update panel items
        panels.push({
          collapsed: false,
          panelGroupId: 'accordion',
          panelId: 'panel2',
          glyphicon: 'glyphicon-phone',
          panelTitle: 'Android',
          item: androidItems
        });
        break;
      }

      // render template and append it to the view
      return {
        panelGroupId: 'accordion',
        panel: panels
      };
    }

    // need to implement this common function for the top views
    isDirty() {
      return false;
    }

    renderShowErrorToggle( arr, device ) {

      // define readerBtnLabel
      var errorFlagBtnlabel = Language.button.show[this.lang];

      // get toggle error flag
      var showErrorFlag = getProp( device, [Const.TOGGLE_ERROR_FLAG], false );

      // update reader btn label
      if ( showErrorFlag ) {

        // update labelk
        errorFlagBtnlabel = Language.button.hide[this.lang];
      }

      // insert destron-settings item
      arr.push({
        itemClass: 'sp-timeout',
        itemLabel: 'Errors',
        itemContent: '<button type="button" class="btn btn-default btn-toggle-errors">' + errorFlagBtnlabel + '</button>'
      });
    }

    renderDeviceType( arr, deviceType ) {

      // insert device-type item
      arr.push({
        itemClass: 'sp-timeout',
        itemLabel: 'Reader',
        itemContent: deviceType
      });
    }

    renderTagLength( arr, device ) {
      var deviceType = getProp( device, [Const.DEVICE_TYPE], -1 );
      switch( deviceType ) {
      case 0:
      case 1:
        break;
      case -1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:

        // insert destron-settings item
        arr.push({
          itemClass: 'sp-timeout',
          itemLabel: 'Tag length',
          // var-number-comp
          itemContent: Templates.mlc({
            label: 'tag-length',
            current: device[Const.TAG_LENGTH_KEY]
          })
        });
        break;
      }
    }

    renderRangeSettings( arr, device ) {

      // single and multi ranges
      var defSingleRange, defMultiRange;

      // check device type
      switch( device[Const.DEVICE_TYPE] ) {
      // 0 - TSL
      // 2 - KT45 (LF)
      case 0:
      case 2:

        // get single and multi range
        defSingleRange = device[Const.TSL_SINGLE_RANGE] || Const.TSL_MIN_RANGE;
        defMultiRange  = device[Const.TSL_MULTI_RANGE] || Const.TSL_MAX_RANGE;
        break;

      // 1 - KT45 (HF)
      case 1:

        // get single and multi range
        defSingleRange = device[Const.KT_SINGLE_RANGE] || Const.KT_MIN_RANGE;
        defMultiRange  = device[Const.KT_MULTI_RANGE] || Const.KT_MAX_RANGE;
        break;

      // 6 - BH9 (HF)
      // 8 - BH9 (LF + UHF)
      case 6:
      case 8:

        // get single and multi range
        defSingleRange = device[Const.BH9_SINGLE_RANGE] || Const.BH9_MIN_RANGE;
        defMultiRange  = device[Const.BH9_MULTI_RANGE] || Const.BH9_MAX_RANGE;
        break;
      }

      // toast
      var t0 = session.get( 'sp_lang', 'SP_LabelsSingleRange') || Language.labels.singleRange[this.lang];
      var t1 = session.get( 'sp_lang', 'SP_LabelsMultiRange') || Language.labels.multiRange[this.lang];

      // insert reader-single-range item
      arr.push({
        itemClass: 'sp-timeout',
        itemLabel: 'Range ' + t0 + ':',
        // var-range-comp
        itemContent: Templates.modalRange({
          mode: Const.SINGLE_MODE,
          current: defSingleRange
        })
      });

      // insert reader-multi-range item
      arr.push({
        itemClass: 'sp-timeout',
        itemLabel: 'Range ' + t1 + ':',
        itemContent: Templates.modalRange({
          mode: Const.MULTI_MODE,
          current: defMultiRange
        })
      });
    }

    renderConnectButton( arr, device, type ) {
      var readerBtnLabel, readerStatusClass;

      // connection type
      // 0 -> BH9-LF Reader
      // 1 -> BH9-UHF Reader
      // 2 -> external reader

      // check type
      var dType = type === undefined ? 2 : type;

      // default device label
      var deviceLabel = 'BT Reader';

      // toast
      var t0 = session.get( 'sp_lang', 'SP_ButtonDisconnect') || Language.button.disconnect[this.lang];
      var t1 = session.get( 'sp_lang', 'SP_ButtonConnect') || Language.button.connect[this.lang];
      var t2 = session.get( 'sp_lang', 'SP_ButtonConnecting') || Language.button.connecting[this.lang];
      var t3 = session.get( 'sp_lang', 'SP_ButtonListening') || Language.button.listening[this.lang];

      // get device type
      if( device[Const.DEVICE_TYPE] == 8 ){

        // update label
        deviceLabel = type ? 'UHF Reader' : 'LF Reader';

        // uhfrfid connection
        if ( type ) {

          // check reader connection status
          if ( getProp(device, [Const.UHF_CONNECTION]) ) {

            // set reader btn label
            readerBtnLabel = capitalize( t0 );

            // set bluetooth status class
            readerStatusClass = 'text-success';
          } else {

            // set bluetooth btn label
            readerBtnLabel = capitalize( t1 );

            // set bluetooth status class
            readerStatusClass = 'text-danger';
          }
        } else {

          // check reader connection status
          if ( getProp(device, [Const.LF_CONNECTION]) ) {

            // set reader btn label
            readerBtnLabel = capitalize( t0 );

            // set bluetooth status class
            readerStatusClass = 'text-success';
          } else {

            // set bluetooth btn label
            readerBtnLabel = capitalize( t1 );

            // set bluetooth status class
            readerStatusClass = 'text-danger';
          }
        }
      } else {

        // update connection label
        switch( getProp(device, [Const.BT_CONNECTION]) ) {
        case Const.STATE_CONNECTED:

          // set reader btn label
          readerBtnLabel = capitalize( t0 );

          // set bluetooth status class
          readerStatusClass = 'text-success';
          break;
        case Const.STATE_CONNECTING:

          // set reader btn label
          readerBtnLabel = capitalize( t2 );
          break;
        case Const.STATE_DISCONNECTED:

          // set bluetooth btn label
          readerBtnLabel = capitalize( t1 );

          // set bluetooth status class
          readerStatusClass = 'text-danger';
          break;
        case Const.STATE_NONE:
          break;
        case Const.STATE_LISTEN:

          // set reader btn label
          readerBtnLabel = capitalize( t3 );
          break;
        }
      }

      // insert destron-settings item
      arr.push({
        itemClass: 'sp-timeout',
        itemLabel: '<span class="connect-status ' + readerStatusClass + '">'+ deviceLabel +'</span>',
        // itemLabel: '<span class="connect-status">'+ deviceLabel +'</span>',
        itemContent: '<button type="button" class="btn btn-default btn-reader" data-type="' + dType + '">' + readerBtnLabel + '</button>'
      });
    }

    renderConnectionStatus( arr, device ) {
      var connectionStatus;

      switch ( getProp(device, [Const.BT_CONNECTION], 0) ) {
      case Const.STATE_DISCONNECTED:
        connectionStatus = 'DISCONNECTED';
        break;
      case Const.STATE_CONNECTING:
        connectionStatus = 'CONNECTING';
        break;
      case Const.STATE_CONNECTED:
        connectionStatus = 'CONNECTED';
        break;

      // idle + listening state
      case Const.STATE_NONE:
      case Const.STATE_LISTEN:
        connectionStatus = 'LISTEN';
        break;
      default:
        connectionStatus = 'DISCONNECTED';
        break;
      }

      // insert connection-status item
      arr.push({
        itemClass: 'sp-timeout',
        itemLabel: 'Connection state',
        itemContent: '<span class="connect-status">' + connectionStatus + '</span>'
      });
    }

    renderMakeVisible( arr ) {

      // toast
      var t0 = session.get( 'sp_lang', 'SP_LabelsMakeVisible') || Language.labels.makeVisible[this.lang];

      // insert make visible item
      arr.push({
        itemClass: 'sp-timeout',
        itemLabel: 'Make visible',
        itemContent: '<button type="button" class="btn btn-default btn-discover">'+ t0 +'</button>'
      });
    }

    renderRestartService( arr ) {

      // toast
      var t0 = session.get( 'sp_lang', 'SP_LabelsRestartService') || Language.labels.restartService[this.lang];

      // insert restart service item
      arr.push({
        itemClass: 'sp-timeout',
        itemLabel: 'Make visible',
        itemContent: '<button type="button" class="btn btn-default btn-service">'+ t0 +'</button>'
      });
    }

    // on reset helper
    onResetSettings() {

      // publish event further
      $.publish( 'reset' );
    }

    // on collapse shown
    onCollapseShown( ev ) {
      var $target = this.$( ev.target );
      var panelId = $target.attr( 'id' );

      // check panel id
      if ( panelId == 'panel2' ) {
        collapsed[ 0 ] = true;
        collapsed[ 1 ] = false;
      } else {
        collapsed[ 0 ] = false;
        collapsed[ 1 ] = true;
      }
    }

    onBack() {

      // navigate to previous route
      Backbone.history.navigate( this.previousRoute || 'index', { trigger: true } );
    }

    onTestDb() {

      // trigger event
      this.trigger( 'test-db' );
    }

    cleanup() {

      // stop listening for custom events
      $.unsubscribe( 'settings' );
    }
  };
};
