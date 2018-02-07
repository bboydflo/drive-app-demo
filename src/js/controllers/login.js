import getProp from 'get-prop';
import Language from '../modules/lang';
import Constants from '../modules/constants';
import SmartPigsError from '../modules/smartpigs-base-error';

// singleton controller
let controllerApi;

export default (session) => {
  let serverAddress = session.get('device', Constants.SERVER_URL) || '/';

  // common request handler
  const commonReguestHandler = (url, credentials) => {
    let cLang = session.get('settings', 'locale') || session.get('settings', 'lang');
    let lang = Language.name[cLang] ? cLang : 'en-us';
    let errLabel = session.get('sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[lang];

    // todo: login
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Accept': 'application/json, text/plain, text/html, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'Accept-Encoding:gzip, deflate'
      }
    }).then(response => response.text()
      /* console.log(response);
      console.log(response.status); // => number 100–599
      console.log(response.statusText); // => String
      console.log(response.headers); // => Headers
      console.log(response.url); // => String */
    ).catch(error => {

      // get production flag in environment
      if (process.env.NODE_ENV === 'production') {
        console.log(error);
      }

      // throw custom error
      throw new SmartPigsError(Language.index.errorMsg8[lang], 4, {
        source: `Server ${errLabel}`,
        connectionState: Constants.NET_SERVER_DOWN
      });
    });
  };

  // check if login controller is already setup;
  if (!controllerApi) {
    controllerApi = {
      loginController: function (url, credentials) {
        let cLang = session.get('settings', 'locale') || session.get('settings', 'lang');
        let lang = Language.name[cLang] ? cLang : 'en-us';
        let errLabel = session.get('sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[lang];

        // return commonReguestHandler(serverAddress + 'login.html', credentials)
        return commonReguestHandler(url, credentials)
          .then(response => {
            if (!response) {
              throw new SmartPigsError('No response!', 1, { source: `Server ${errLabel}` });
            }

            if (typeof response === 'string' && response.charAt(0) === '!') {
              throw new SmartPigsError(response.substring(1, response.length), 1, { source: `Server ${errLabel}` });
            }

            let jsonResponse;
            try {
              jsonResponse = JSON.parse(response);
            } catch (e) {

              // get production flag in environment
              if (process.env.NODE_ENV === 'production') {
                console.log(e);
              }

              throw new SmartPigsError('Invalid server response!', 1, { source: `Server ${errLabel}` });
            }

            // get new session key
            let sessionKey = getProp(jsonResponse, ['sessionKey'], '');

            if (!sessionKey) {
              throw new SmartPigsError('Invalid session key!', 1, { source: `Server ${errLabel}` });
            }

            // get login type
            let loginType = getProp(jsonResponse, ['loginType'], '');

            // check for loginType
            if (loginType) {

              // update credentials based on login type
              switch (loginType) {
                case 1:
                  credentials.userPW = '';
                  break;
                case 2:
                  credentials.userPW = '';
                  credentials.user = '';
                  break;
                case 3:
                  credentials.userPW = '';
                  credentials.user = '';
                  credentials.databasePW = '';
                  break;
                case 4:
                  credentials.userPW = '';
                  credentials.user = '';
                  credentials.databasePW = '';
                  credentials.database = '';
                  break;
              }

              // update credentials
              session.set('cache', 'credentials', credentials).persist();
            }

            return jsonResponse;
          });
      },
      checkStatus: function (session) {
        let sessionKey = session.get('layouts', 'sessionKey');
        let credentials = session.get('cache', 'credentials');

        let cLang = session.get('settings', 'locale') || session.get('settings', 'lang');
        let lang = Language.name[cLang] ? cLang : 'en-us';
        let errLabel = session.get('sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[lang];

        // check network status
        return commonReguestHandler(serverAddress + 'check.html?' + sessionKey, credentials)
          .then(response => {
            if (!response) {
              throw new SmartPigsError('No response!', 1, { source: `Server ${errLabel}` });
            }

            if (typeof response === 'string' && response.charAt(0) === '!') {
              throw new SmartPigsError(response.substring(1, response.length), 1, { source: `Server ${errLabel}` });
            }

            return true;
          });
      },
      reLogin: function (session, credentials) {
        let cLang = session.get('settings', 'locale') || session.get('settings', 'lang');
        let lang = Language.name[cLang] ? cLang : 'en-us';
        let errLabel = session.get('sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[lang];

        // relogin request -> update session key
        return commonReguestHandler(serverAddress + 'relogin.html', credentials)
          .then(response => {
            if (!response) {
              throw new SmartPigsError('No response!', 1, { source: `Server ${errLabel}` });
            }

            if (typeof response === 'string' && response.charAt(0) === '!') {
              throw new SmartPigsError(response.substring(1, response.length), 1, { source: `Server ${errLabel}` });
            }

            // get new session key
            let sessionKey = getProp(response, ['sessionKey'], '');

            if (!sessionKey) {
              throw new SmartPigsError('Invalid session key!', 1, { source: `Server ${errLabel}` });
            }

            // update session key. also persist changes
            session.set('layouts', 'sessionKey', sessionKey).persist();

            return null;
          });
      }
    };
  }

  // login controller api
  return controllerApi;
};
