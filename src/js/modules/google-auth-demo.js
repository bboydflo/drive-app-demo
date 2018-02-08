// import toArray from 'stream-to-array';

// tutorial here: https://developers.google.com/drive/v3/web/quickstart/js

// Client ID and API key from the Developer Console
const CLIENT_ID = '378789089814-77dah8n0j12glfhi2aa1ic73enacfnks.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAM1Ktgs9e1YlIdLwcgiH_aHNN5hFdEkMw';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly';
const SCOPES = 'https://www.googleapis.com/auth/drive';

export const handleClientLoad = (callback) => {
  gapi.load('client:auth2', callback);
};

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
export const initClient = () => {
  return gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  });
};

// listen for signin state changes
export function listenForSignInChanges(callback) {

  // Listen for sign-in state changes.
  gapi.auth2.getAuthInstance().isSignedIn.listen(callback);

  // Handle the initial sign-in state.
  callback(gapi.auth2.getAuthInstance().isSignedIn.get());
}

/**
 *  Sign in the user upon button click.
 */
export function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
export function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
export function appendPre(message) {
  // var pre = document.getElementById('content');
  // var textContent = document.createTextNode(message + '\n');
  // pre.appendChild(textContent);
  console.log(message);
}

/**
 * Print files.
 */
export function getFiles(pageSize) {
  return gapi.client.drive.files.list({
    'pageSize': pageSize,
    'fields': 'nextPageToken, files(id, name)'
  });
}

/**
 * get single file by id
 * nodejs example url: https://developers.google.com/drive/v3/web/manage-downloads
 */
export function getFileById(fileId) {

  // or this: gapi.auth.getToken().access_token;
  const accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;

  // return gapi.client.drive.files.get(
  //   `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
  // ).then(function (data) {

  // ?access_token = ' + encodeURIComponent(oauthToken))
  // return gapi.client.drive.files.get({
  //   fileId: fileId,
  //   alt: 'media'
  // });

  // let myHeaders = new Headers();
  // myHeaders.append('Content-Type', 'application/pdf');
  // myHeaders.append('Authorization', 'Bearer ' + accessToken);

  /* let fetchOptions = {
    // mode: 'cors',
    method: 'GET'
    // headers: myHeaders
    // cache: 'default'
  }; */

  // example here: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  // return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`, fetchOptions).then(response => {
  return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&&access_token=${accessToken}`).then(response => {
    if (response.ok) {
      console.log(response);
      // response.body
      // example here: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams
      const reader = response.body.getReader();
      return new ReadableStream({
        start(controller) {
          return pump();
          function pump() {
            return reader.read().then(({ done, value }) => {
              // When no more data needs to be consumed, close the stream
              if (done) {
                controller.close();
                return;
              }
              // Enqueue the next data chunk into our target stream
              controller.enqueue(value);
              return pump();
            });
          }
        }
      })
        .then(stream => new Response(stream))
        .then(response => response.blob())
        .then(blob => URL.createObjectURL(blob));
    }
    throw new Error('Network response was not ok.');
  });
}
