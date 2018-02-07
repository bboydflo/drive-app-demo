import _ from 'underscore';
import Base64 from 'base64';
import isPojo from 'is-pojo';
import getProp from 'get-prop';

/* eslint-disable */
// module instance
let utilsAPI;

// IIFE's
(function () {
  try {

    // var a = new Uint8Array(1);
    new Uint8Array(1);
    // return;
  } catch (e) {

    // throw error
    throw e;
  }

  function subarray (start, end) {
    return this.slice(start, end);
  }

  function set_ (array, offset) {
    if (arguments.length < 2) {
      offset = 0;
    }
    for (var i = 0, n = array.length; i < n; ++i, ++offset) {

      /*jshint validthis:true */
      this[offset] = array[i] & 0xFF;
    }
  }

  // we need typed arrays
  function TypedArray (arg1) {
    var result;
    if (typeof arg1 === 'number') {
      result = new Array(arg1);
      for (var i = 0; i < arg1; ++i) {
        result[i] = 0;
      }
    } else {
      result = arg1.slice(0);
    }
    result.subarray = subarray;
    result.buffer = result;
    result.byteLength = result.length;
    result.set = set_;
    if (typeof arg1 === 'object' && arg1.buffer) {
      result.buffer = arg1.buffer;
    }

    return result;
  }

  global.Uint8Array = TypedArray;
  global.Uint32Array = TypedArray;
  global.Int32Array = TypedArray;
})();

/*// IIFE
(function(){
  if ('response' in XMLHttpRequest.prototype ||
        'mozResponseArrayBuffer' in XMLHttpRequest.prototype ||
        'mozResponse' in XMLHttpRequest.prototype ||
        'responseArrayBuffer' in XMLHttpRequest.prototype) {
      return;
  } else {
    Object.defineProperty(XMLHttpRequest.prototype, 'response', {
      get: function() {
        return new Uint8Array(new VBArray(this.responseBody).toArray());
      }
    });
  }
})();*/

// IIFE -> add functions to string prototype ASAP
(function () {
  String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  String.prototype.trimToLength = function (trimLenght) {
    return this.length > trimLenght ? this.substring(0, trimLenght - 3) + '...' : this;
  };
})();

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function atob(input) {
  input = String(input);
  var position = 0,
    output = [],
    buffer = 0, bits = 0, n;

  input = input.replace(/\s/g, '');
  if ((input.length % 4) === 0) { input = input.replace(/=+$/, ''); }
  if ((input.length % 4) === 1) { throw Error('InvalidCharacterError'); }
  if (/[^+/0-9A-Za-z]/.test(input)) { throw Error('InvalidCharacterError'); }

  while (position < input.length) {
    n = B64_ALPHABET.indexOf(input.charAt(position));
    buffer = (buffer << 6) | n;
    bits += 6;

    if (bits === 24) {
      output.push(String.fromCharCode((buffer >> 16) & 0xFF));
      output.push(String.fromCharCode((buffer >> 8) & 0xFF));
      output.push(String.fromCharCode(buffer & 0xFF));
      bits = 0;
      buffer = 0;
    }
    position += 1;
  }

  if (bits === 12) {
    buffer = buffer >> 4;
    output.push(String.fromCharCode(buffer & 0xFF));
  } else if (bits === 18) {
    buffer = buffer >> 2;
    output.push(String.fromCharCode((buffer >> 8) & 0xFF));
    output.push(String.fromCharCode(buffer & 0xFF));
  }

  return output.join('');
}

function btoa(input) {
  input = String(input);
  var position = 0,
    out = [],
    o1, o2, o3,
    e1, e2, e3, e4;

  if (/[^\x00-\xFF]/.test(input)) { throw Error('InvalidCharacterError'); }

  while (position < input.length) {
    o1 = input.charCodeAt(position++);
    o2 = input.charCodeAt(position++);
    o3 = input.charCodeAt(position++);

    // 111111 112222 222233 333333
    e1 = o1 >> 2;
    e2 = ((o1 & 0x3) << 4) | (o2 >> 4);
    e3 = ((o2 & 0xf) << 2) | (o3 >> 6);
    e4 = o3 & 0x3f;

    if (position === input.length + 2) {
      e3 = 64;
      e4 = 64;
    }
    else if (position === input.length + 1) {
      e4 = 64;
    }

    out.push(B64_ALPHABET.charAt(e1), B64_ALPHABET.charAt(e2), B64_ALPHABET.charAt(e3), B64_ALPHABET.charAt(e4));
  }

  return out.join('');
}

// Base64 utility methods Needed for: IE9-
// from: https://github.com/inexorabletash/polyfill/blob/master/html.js
if (!('atob' in global) || !('btoa' in global)) {
  global.atob = atob;
  global.btoa = btoa;
}

// adjust date api for browsers that do not have this method
if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
/**
 * Decimal adjustment of a number.
 *
 * @param {String}  type  The type of adjustment.
 * @param {Number}  value The number.
 * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
 * @returns {Number} The adjusted value.
 */
function decimalAdjust(type, value, exp) {
  // If the exp is undefined or zero...
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math[type](value);
  }
  value = +value;
  exp = +exp;
  // If the value is not a number or the exp is not an integer...
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }
  // Shift
  value = value.toString().split('e');
  value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
  // Shift back
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

// Decimal round
if (!Math.round10) {
  Math.round10 = function (value, exp) {
    return decimalAdjust('round', value, exp);
  };
}
// Decimal floor
if (!Math.floor10) {
  Math.floor10 = function (value, exp) {
    return decimalAdjust('floor', value, exp);
  };
}
// Decimal ceil
if (!Math.ceil10) {
  Math.ceil10 = function (value, exp) {
    return decimalAdjust('ceil', value, exp);
  };
}

// module exports -> singleton pattern
// http://viralpatel.net/blogs/javascript-singleton-design-pattern/
export default (M, s) => {

  // define methods
  let map = _.map;
  let filter = _.filter;
  let isEqual = _.isEqual;
  let isArray = _.isArray;
  let includes = _.includes;

  // check if utils api is already initialized
  if (utilsAPI) return utilsAPI;

  // constructor
  const create = (Menubar, session) => {
    return {

      // convert string with comma and period, to a valid number
      toNumber(value) {

        // if no value passed
        if (typeof value == 'undefined') return NaN;

        // force value to be a string and replace any ',' with '.'
        value = value.toString().replace(new RegExp(',', 'g'), '.');

        // check if the resulting value is a number
        // disable es-lint tule here:
        // TODO: fixed implementation to pass both es-lint and my code
        /* eslint-disable */
        if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
          return Number(value);
        }

        // return falsie value
        return NaN;
      },

      // check if value is number
      isInt(n) {

        // development
        // if (true) return n;

        // value is a number
        return Number(n) === n && n % 1 === 0;
      },

      // return first layout found by key and value
      getLayoutBy(key1, val1, layouts) {
        let menuItem = [];

        // get sides
        map(layouts || session.get('layouts'), side => {

          // filter out empty columns
          if (getProp(side, ['items'], []).length) {

            // skip if menu items already found
            if (menuItem.length) return false;

            // get menu item
            menuItem = filter(side.items, item => isEqual(item[key1], val1));
          }
        });

        return menuItem.length ? menuItem[0] : false;
      },

      getLayoutByPosIdx(pos, idx, layouts) {

        // position is not valid
        if (!includes(['left', 'center', 'right'], pos)) return;

        // get layout object
        layouts = layouts || session.get('layouts');

        // get sowcard layout
        // let sowcardLayout = getProp(layouts[pos], ['items', 0], );
        return getProp(layouts[pos], ['items', 0]);
      },

      updateLayoutBy(key1, val1, key2, val2, nested) {
        let layouts = session.get('layouts');
        let menuItem = [];
        let shouldUpdate = false;

        // get sides
        map(layouts, (side, layoutKey) => {

          // filter out empty columns
          if (getProp(side, ['items'], []).length) {

            // skip if menu items already found
            if (menuItem.length) return false;

            // get menu item
            menuItem = filter(side.items, (item, idx) => {
              var isequal = isEqual(item[key1], val1);

              // update key and update value
              if (args.length == 4 && isequal) {

                // the two values are the same -> no need for update
                if (isEqual(item[key2], val2)) return false;

                // update layouts
                layouts[layoutKey].items[idx][key2] = val2;

                // update shouldUpdate flag
                shouldUpdate = true;

                // resume
                return true;
              }

              return isequal;
            });
          }
        });

        // check menu item
        if (menuItem.length) {

          // should update
          if (shouldUpdate) {

            // update layouts
            session.set('layouts', layouts).persist();
          }

          // resume success
          return menuItem[0];
        }

        return false;
      },

      // key, value -> used to search a layout by [key, value] pair
      // sLayout -> sub layout to be updated
      setLayoutBy(key, value, sLayout) {
        let menuItem = [];

        // layouts
        let layouts = session.get('layouts');

        // get sides
        map(layouts, (side, layoutKey) => {

          // filter out empty columns
          if (!getProp(side, ['items'], []).length) return;

          // skip if menu items already found
          if (menuItem.length) return false;

          // get menu item
          menuItem = filter(side.items, (item, idx) => {
            let eq = isEqual(item[key], value);

            // check if it's equal
            if (eq) {

              // update sub layout
              layouts[layoutKey].items[idx] = sLayout;
            }

            // resume
            return eq;
          });
        });

        // check menu item
        if (menuItem.length) {

          // update layouts
          session.set('layouts', layouts).persist();

          // success
          return true;
        } else {
          this.saveNestedLayout(layouts, key, value, sLayout);

          // update layouts
          session.set('layouts', layouts).persist();

          // success
          return true;
        }

        // error
        return false;
      },

      // used to update layouts with iconName
      setLayoutsIconName(layouts) {
        let sides = ['left', 'center', 'right'];

        // validate new layouts. resume early
        if (!isPojo(layouts) || _.isEmpty(layouts)) return false;

        // filter sides that have no items
        sides = filter(sides, sideName => getProp(layouts, [sideName, 'items'], []).length);

        // validate sides. resume early
        if (!sides.length) return false;

        // map through each slide
        map(sides, sideName => {

          // filter wrong layouts
          layouts[sideName].items = filter(layouts[sideName].items, item => {

            // check each header
            for (var i = 0; i < item.thead.length; i++) {

              // filter wrong layouts
              if (!item.thead[i].th.length && item.requestKey.toLowerCase().indexOf('card') < 0) return false;
            }

            // resume
            return true;
          });

          // map through each item and add 'iconName' attribute
          layouts[sideName].items = map(layouts[sideName].items, item => {

            // add iconName attribute to each item
            // assume that imagePath attribute exists on each item
            item.iconName = item.imagePath.split('.')[0];

            // resume
            return item;
          });
        });

        // add nested layouts
        layouts.nested = {items: []};
      },

      // get nested layout
      getNestedLayout(layouts, key, value) {
        var args = Array.prototype.slice.call(arguments),
          menuItem = [];

        // check if enough arguments
        if (args.length !== 3) return false;

        // check nested side
        if (!layouts || !getProp(layouts.nested, ['items'], []).length) return false;

        // get menu item
        menuItem = filter(layouts.nested.items, item => isEqual(item[key], value));

        // check menu item
        return menuItem.length ? menuItem[0] : false;
      },

      // save nested layout in the local storage
      saveNestedLayout(layouts, key, value, layout) {

        // search for nested layout
        let nestedLayout = this.getNestedLayout(layouts, key, value);

        // update key value
        layout[key] = value;

        // search for nested layout by key and value
        if (!nestedLayout) {

          // update nested layouts
          layouts.nested.items.push(layout);
        }

        // return success
        return layout;
      },

      // remove nested layouts
      removeNestedLayout(layouts, key, value) {
        var result = false;

        // check nested side
        if (!layouts || !getProp(layouts.nested, ['items'], []).length) return result;

        // loop vars
        var i;

        // loop through nested layouts
        for (i = 0; i < layouts.nested.items.length; i++) {

          // check key
          if (isEqual(layouts.nested.items[i][key], value)) {

            // remove layout at position
            layouts.nested.items.splice(i, 1);

            // break the loop
            // break;
            // resume success
            return true;
          }
        }
      },

      // base64 encoding
      base64Encode(str) {
        var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        var out = '', i = 0, len = str.length, c1, c2, c3;
        while (i < len) {
          c1 = str.charCodeAt(i++) & 0xff;
          if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt((c1 & 0x3) << 4);
            out += '';
            break;
          }
          c2 = str.charCodeAt(i++);
          if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += CHARS.charAt((c2 & 0xF) << 2);
            out += '=';
            break;
          }
          c3 = str.charCodeAt(i++);
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
          out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
          out += CHARS.charAt(c3 & 0x3F);
        }
        return out;
      },

      createSelectInput(options, cValue, showCurrentUser, username) {
        let _default, hasSelectedItem,
          data = [];

        // map options to callback
        // check jquery map http://api.jquery.com/jQuery.map/
        // mapValues(options, (value, key) => {
        _.mapObject(options, (val, key) => {
          let value = key;
          let selected = '';

          // get trimmed value
          // let clearedValue = $.trim(val);
          let clearedValue = val.trim();

          // extra checks
          if (clearedValue) {

            // define view value
            value += ', ' + val;
          }

          // check current value
          if (cValue !== '') {

            // update cValue to be a string for a smooth comparison
            cValue += '';

            // check if medarbejder
            if (!hasSelectedItem && cValue.toLowerCase() == key.toLowerCase()) {

              // has selected item
              hasSelectedItem = true;

              // update selected
              selected = 'selected';
            }
          } else {

            // check if medarbejder
            if (!hasSelectedItem && showCurrentUser && key.toLowerCase() == username) {

              // has selected item
              hasSelectedItem = true;

              // update selected
              selected = 'selected';
            }
          }

          // fill data array
          data.push({ key, value, selected });
        });

        // resume
        return data;
      },

      /**
       * [cutDecimals description]
       * @param  {number|string} numberValue to cut decimals from
       * @param  {number} numberOfDecimals - number of decimals to cut off
       * @return {number} new float number or the original number
       */
      cutDecimals(numberValue, numberOfDecimals) {
        var integ, deci, numberAsString;

        // check if value is a number. should also check
        // that the coresponding column is of number type
        if (!isNaN(numberValue)) {

          // convert the number to string
          numberAsString = numberValue + '';

          // check if it has any decimals
          if (numberAsString.indexOf('.') > 0) {

            // get integer part and decimal part
            integ = numberAsString.split('.')[0];
            deci = numberAsString.split('.')[1];

            // more than 2 decimals
            if (deci.length > numberOfDecimals) {

              // keep only the first two decimals
              // deci = deci.substring(0, numberOfDecimals + 1);
              deci = deci.substring(0, numberOfDecimals);
            }

            // update row data
            // return parseFloat(integ + '.' + deci);
            return Math.ceil10(parseFloat(integ + '.' + deci), -deci);
          }
        }

        // resume
        return numberValue;
      },

      // generate random id's randomly
      // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript#105074
      generateRowId() {
        var d = Date.now();
        if (global.performance && typeof global.performance.now === 'function') {
          d += performance.now(); //use high-precision timer if available
        }
        // var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var uuid = 'xxxxxxxx-xxxx-4xxx'.replace(/[xy]/g, function (c) {
          var r = (d + Math.random() * 16) % 10 | 0;
          d = Math.floor(d / 16);
          return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return 'a' + uuid;
      },

      /**
       * ajax request fail handler. updates connection state
       * does logging. returns new connection state
       */
      ajaxFail(req, status) {

        // get connection type
        let connectionState = status == 'timeout' ? 2 : 3;

        // save new connection state
        session.set('app', 'connection', connectionState).persist();

        // init menu module
        let menubar = Menubar({
          lang: session.get('settings', 'lang'),
          connection: session.get('app', 'connection')
        });

        // trigger offline mode
        menubar.updateModel({ connection: connectionState });

        // log error to the console
        // log.warn(err);

        // resume
        return connectionState;
      },

      getNestedFragment(fragment) {
        let prefix, parsedFragment;

        // get fragment
        if (fragment.indexOf('n/') < 0) {
          if (fragment.indexOf('pdf/') < 0) {
            throw new Error('Navigation error. Missing valid prefix [n|pdf]!');
          } else {
            prefix = 'pdf';
          }
        } else {
          prefix = 'n';
        }

        /* // check fragment
        if (fragment.indexOf('n/') < 0 || fragment.indexOf('pdf/')) {
          throw new Error('SmartPigs navigation error!');
        } */

        try {
          // parsedFragment = JSON.parse(Base64.decode(fragment.split('n/')[1]));
          parsedFragment = JSON.parse(Base64.decode(fragment.split(`${prefix}/`)[1]));
        } catch (e) {
          throw new Error(`Navigation error! (Error: ${e.message}, fragment: ${fragment})`);
        }

        // simple fragment validation
        if (!isArray(parsedFragment) || !parsedFragment.length) {
          throw new Error(`Navigation fragment error! (fragment ${fragment})`);
        }

        let lastFragment = parsedFragment.pop();

        // get last fragment details
        // if (!$.isPlainObject(lastFragment) || !lastFragment.requestKey) {
        if (!isPojo(lastFragment) || !lastFragment.requestKey) {
          throw new Error(`Route ${fragment} details error. Please report error!`);
        }

        return [lastFragment, parsedFragment];
      }
    };
  };

  // create utils api
  utilsAPI = create(M, s);

  // create utils api instance only once
  return utilsAPI;
};
