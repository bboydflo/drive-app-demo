import { SERVER_REQUEST } from '../types';

/**
 * api calls middleware
 */
const apiCalls = ({ getState }) => next => action => {
  if (action.type === SERVER_REQUEST) {
    let method = action.payload.method || 'GET';

    if (method === 'POST') {
      fetch(action.payload.url, {
        method,
        body: JSON.stringify(action.payload.body),
        headers: {
          'Accept': 'text/plain, text/html, application/json, */*',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Encoding': 'Accept-Encoding:gzip, deflate'
        }
      }).then(response => {
        // console.log(response);
        // https://developer.mozilla.org/en-US/docs/Web/API/Response
        /* console.log(response.status); // => number 100–599
        console.log(response.statusText); // => String
        console.log(response.headers); // => Headers
        console.log(response.url); // => String */

        if (!response.ok) {
          return action.payload.onError(new Error(response));
        }

        // check response type
        if (action.payload.responseType && action.payload.responseType === 'json') {
          try {
            response.json().then(resp => action.payload.onSuccess(resp));
          } catch (e) {
            e.response = response;
            action.payload.onError(e);
          }
        } else {
          action.payload.onSuccess(response.text());
        }
      }).catch(err => {
        console.log(err);
        action.payload.onError(err);
      });
    }
  } else {
    let result = next(action);
    return result;
  }
};

export default apiCalls;
