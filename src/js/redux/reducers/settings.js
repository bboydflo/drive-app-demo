// import parseUri from './parseUri';
import pdfSupport from '../../modules/pdf-native-support';
import { STORAGE_KEY } from '../types';

// is in production mode
let isProduction = process.env.NODE_ENV === 'production';

// update version
const version = process.env.version;

/* // current url
const cUrl = global.location.href || global.document.URL;

// get url parsed object
const url = parseUri(cUrl);

// get url props
const urlProps = {
  port: url.port,
  host: url.host,
  protocol: url.protocol
}; */

// define initial settings
let initialSettings = {
  version,
  storageKey: STORAGE_KEY,
  production: isProduction,
  acrobatInfo: pdfSupport(),
  dbVersion: 1,

  // update this to be true when using the fake server
  poc: false
};

export default (state = initialSettings, action) => state;
