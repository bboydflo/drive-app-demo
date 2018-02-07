/* eslint-disable */
/**
 * @param  {boolean} production
 * @param  {string} storageKey
 * @param  {string} version
 * @param  {object} url (contains url, host and port properties)
 * @param  {} acrobatInfo (contains browser, installed, and version properties)
 */
export default (production, storageKey, version, url, acrobatInfo) => ({
  settings: {
    version,
    storageKey,
    production,
    acrobatInfo,
    dbVersion: 1,
    poc: true, // proof of concept, used to update urls when using as a proof of concept with my dumb server implementtation
    // logging: false,
    // debugging: !production,
  },
  ui: {
    lang: 'en-us',
    pLang: 'US',
    // dateFormat: 'dd-mm-yyyy',
    // update default date format in order to accomodate the new formatting library
    dateFormat: 'dd-MM-yyyy',
    fadeIn: 100,
    fadeOut: 10,
    menuType: 0,
    connection: 1,
    credentials: {},
    page: '/',
  },
  dirty: {},
  android: {
    type: -1, // device type
    code: '', // device code
    model: '', // device model
    version: '', // device android version
    app_name: 'sPigs.apk', // default apk name
    app_version: '',
    tagLength: 6, // default lfrfid tag length
    bluetooth: 0, // bluetooth hardware state(enable/disable)
    btConnection: 0, // default bluetooth connection state(STATE_DISCONNECTED)
    lfConnection: 0, // default lf readers connection state(STATE_DISCONNECTED)
    uhfConnection: 0, // default uhf readers connection state(STATE_DISCONNECTED),
    // server_address: '/'
    server_address: 'http://localhost:3000/'
  },
  url,
  logs: [],
  sp_lang: {}
});
