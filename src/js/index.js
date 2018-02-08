import 'whatwg-fetch';
import 'preact/devtools';
import 'pdfjs-dist';

import Domready from 'domready';
import { Promise as P } from 'promise-polyfill';

import start from './modules/start';

// IIFE -> add functions to string prototype ASAP
(function () {
  // eslint-disable-next-line
  String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  // eslint-disable-next-line
  String.prototype.trimToLength = function (trimLenght) {
    return this.length > trimLenght ? this.substring(0, trimLenght - 3) + '...' : this;
  };
})();

// add promise support for browsers that are not supporting promises
if (!global.Promise) {
  global.Promise = P;
}

Domready(start);
