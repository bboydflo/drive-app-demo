/* eslint-disable */
export default {

  // namespace
  ns                   : '_SmartPigs',
  TOAST                : 'toast',
  BLUETOOTH            : 'bluetooth',
  ONLINE_MODE_KEY      : 'online',
  RANGE_KEY            : 'range',
  READER_MODE_KEY      : 'mode',
  BT_DEVICE_ADDRESS    : 'device_address',
  TAG_LENGTH_KEY       : 'tagLength',
  ASCII_INTENT_REASON  : 'intent_reason',
  MSG_DOWNLOAD_PATH    : 'path',
  MSG_KEY_LFRFID       : 'bh9-lfrfid',
  MSG_KEY_UHFRFID      : 'bh9-uhfrfid',
  BT_STATE_KEY         : 'btState',
  NETWORK_STATE_KEY    : 'connected',
  SINGLE_MODE          : 'single',
  MULTI_MODE           : 'multi',
  TSL_POWER_LEVEL      : 'tslPowerLevel',
  BH9_POWER_LEVEL      : 'bh9PowerLevel',
  KT45_POWER_LEVEL     : 'kt45PowerLevel',
  ACTIVITY_URL         : 'href',
  BT_CONNECTION        : 'btConnection',
  LF_CONNECTION        : 'lfConnection',
  UHF_CONNECTION       : 'uhfConnection',
  DEVICE_CODE          : 'code',
  DEVICE_NAME          : 'name',
  DEVICE_TYPE          : 'type',
  DEVICE_MODEL         : 'model',
  DEVICE_VERSION       : 'version',
  DEVICE_MANUFACTURER  : 'manufacturer',
  TSL_SINGLE_RANGE     : 'tslSingleRange',
  TSL_MULTI_RANGE      : 'tslMultiRange',
  TSL_BARCODE_RESULT   : 'barcode-result',
  KT_SINGLE_RANGE      : 'kt45SingleRange',
  KT_MULTI_RANGE       : 'kt45MultiRange',
  BH9_SINGLE_RANGE     : 'bh9SingleRange',
  BH9_MULTI_RANGE      : 'bh9MultiRange',
  MORE_AVAILABLE       : 'more',
  TSL_MIN_RANGE        : 10,
  TSL_MAX_RANGE        : 29,
  KT_MIN_RANGE         : 16,
  KT_MAX_RANGE         : 26,
  BH9_MIN_RANGE        : 16,
  BH9_MAX_RANGE        : 26,
  TOGGLE_ERRORS        : false,                       // toggle error toast default true
  STATE_DISCONNECTED   : 0,                           // disconnected from remote device
  STATE_CONNECTING     : 1,                           // initiating an outgoing connection
  STATE_CONNECTED      : 2,                           // connected to a remote device
  STATE_NONE           : 3,                           // idle
  STATE_LISTEN         : 4,                           // listen for incoming connections
  NET_CONNECTED        : 1,                           // connected to internet
  NET_TIMEOUT          : 2,                           // connection timeout
  NET_SERVER_DOWN      : 3,                           // no connection to the server (server down)
  NET_OFFLINE          : 4,                           // manually went in offline mode

  ROW_HEIGHT           : 35,                          // row height
  NAV_HEIGHT           : 51,                          // navigation height
  SCROLL_UP            : 15,                          // number of threshold rows when scrolling up
  SCROLL_DOWN          : Modernizr.mobile ?  5 :  8,  // number of threshold rows when scrolling down
  HIDDEN_ROWS          : Modernizr.mobile ? 20 : 16,  // number of top/bottom hidden rows
  PANEL_TITLE__HEIGHT  : 42,                          // panel heading height
  PANEL_FOOTER_HEIGHT  : 32,                          // panel footer height
  SCROLLBAR_HEIGHT     : Modernizr.mobile ? 5 : 20,
  TIMER_THRESHOLD      : Modernizr.mobile ? 200 : 350,
  SERVER_URL           : 'server_address',
  APP_NAME             : 'app_name',
  APP_VERSION          : 'app_version',
  SOURCE_CODE          : 'source',
  TOGGLE_ERROR_FLAG    : 'toggleError',

  PROGRAM_LANG_MAP: {
    'US': 'en-us',
    'DK': 'da',
    'NL': 'nl',
    'DE': 'de',
    'CZ': 'cs',
    'GB': 'en-gb',
    'PH': 'en-ph',
    'AU': 'en-au',
    'ES': 'es',
    'EE': 'et',
    'FI': 'fi',
    'JP': 'ja',
    'NO': 'no',
    'PL': 'pl',
    'RU': 'ru',
    'SE': 'sv',
    'UA': 'uk',
    'CN': 'zh',
    'TH': 'th',
    'MK': 'mk',
    'RS': 'sr',
    'BG': 'bg',
    'VN': 'vi'
  },

  PROGRAM_LANGS: {
    'US': 'en-us',
    'DK': 'da',
    'NL': 'nl',
    'DE': 'de'
  },

  // db table types
  // 0 - normal table
  // 1 - sow card table
  // 2 - breeding card table
  DB_TABLES: [{
    name: 'layout',
    type: 0,
    structure: ''
  }, {
    name: 'card1',
    type: 1,
    structure: ''
  }, {
    name: 'card2',
    type: 2,
    structure: ''
  }]
};
