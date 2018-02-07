// Client ID and API key from the Developer Console
const CLIENT_ID = '635136783186-4ql36uathmopkbc8maeg020vrfnfpngj.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDxZC99hAP5kRXdcb4iyEHN7kL0QpfmrTQ';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

// var authorizeButton = document.getElementById('authorize-button');
// var signoutButton = document.getElementById('signout-button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
// export function handleClientLoad() {
//   gapi.load('client:auth2', initClient);
// }

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
export function initClient () {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    // authorizeButton.onclick = handleAuthClick;
    // signoutButton.onclick = handleSignoutClick;
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
export function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    // authorizeButton.style.display = 'none';
    // signoutButton.style.display = 'block';
    console.log('hide authorize button and show sign out button');
    listFiles();
  } else {
    // authorizeButton.style.display = 'block';
    // signoutButton.style.display = 'none';
    console.log('show authorize button and hide sign out button');
  }
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
export function listFiles() {
  gapi.client.drive.files.list({
    'pageSize': 10,
    'fields': 'nextPageToken, files(id, name)'
  }).then(function (response) {
    appendPre('Files:');
    var files = response.result.files;
    if (files && files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        appendPre(file.name + ' (' + file.id + ')');
      }
    } else {
      appendPre('No files found.');
    }
  });
}
