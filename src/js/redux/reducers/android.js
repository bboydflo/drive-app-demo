// import parseUri from '../../modules/parseUri';
import { UPDATE_DEVICE_STATE } from '../types/index';
// import constants from '../../modules/constants';

const initialUiState = {
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
  // serverAddress: '/'
  // serverAddress: 'http://localhost:3000/'
  serverAddress: 'http://192.168.1.26:8787/'
};

/* // current url
const cUrl = global.location.href || global.document.URL;

// get url parsed object
const url = parseUri(cUrl);

// get url props
const urlProps = {
  port: url.port,
  host: url.host,
  protocol: url.protocol
};

// log
console.log(urlProps); */

export default (state = initialUiState, action) => {
  switch (action.type) {
    case UPDATE_DEVICE_STATE:
      return Object.assign({}, state, action.payload);
    default:
      return state;
  }
};
