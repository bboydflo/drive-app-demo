// import _ from 'underscore';
import Tree from './simple-tree';
// tutorial here: https://developers.google.com/drive/v3/web/quickstart/js

// Client ID and API key from the Developer Console
const CLIENT_ID = '378789089814-77dah8n0j12glfhi2aa1ic73enacfnks.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAM1Ktgs9e1YlIdLwcgiH_aHNN5hFdEkMw';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly';
// const SCOPES = 'https://www.googleapis.com/auth/drive';
const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appfolder https://www.googleapis.com/auth/drive.readonly.metadata';

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
export function signIn() {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
export function signOut() {
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

export function getFolderStructure() {
  // gapi.client.drive.files.list({ q: "'appDataFolder' in parents" }).then(resp => console.log(resp));
  // gapi.client.drive.files.list({ q: "mimeType = 'application/vnd.google-apps.folder' trashed=false", spaces: 'drive' });
  // gapi.client.drive.files.list({ q: "mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='mimeType' and value='application/pdf' }", spaces: 'drive' });
  // gapi.client.drive.files.list({ q: "mimeType = 'application/vnd.google-apps.folder' and name contains 'pdf'", spaces: 'drive' });
  // gapi.client.drive.files.list({q: "mimeType = 'application/pdf'", spaces: 'drive', useDomainAdminAccess: true, trashed: false});
  // gapi.client.drive.files.list({ q: "fullText contains '.pdf'", spaces: 'drive', useDomainAdminAccess: true, trashed: false });
  // gapi.client.drive.files.list({ 'fields': "nextPageToken, files(id, name)" }).execute();

  /* // get all folders from google drive
  gapi.client.drive.files.list({
    q: 'mimeType = "application/vnd.google-apps.folder"',
    fields: 'nextPageToken, files(id, name, parents)',
    spaces: 'drive'
  }); */

  Promise.all([getRootPdfFiles(), getRootFolders(), getRemainingFolders(), getPdfFiles()])
    .then(nodes => {

      // log
      console.log(nodes);

      // create a new tree
      var t = new Tree({ id: 'root' });

      // nodes[0] = root pdf files
      // nodes[1] = root folders
      // nodes[2] = remaining folders (not directly inside root folder)
      // nodes[3] = remaining pdf files (not directly inside root folder)

      var index = 0;

      // add root folders
      while (index < nodes[1].length) {
        if (nodes[1][index].trashed) continue;
        t.add(nodes[1][index], 'root', t.traverseBF);
        index++;
      }

      index = 0;

      // add root pdf files
      while (index < nodes[0].length) {
        t.add(nodes[0][index], 'root', t.traverseBF);
        index++;
      }

      // traverse tree
      t.traverseBF(node => { console.log(node.data); });

      // add remaining folders
      // while (nodes[2].length > 0) {}

      // skip
      let skip = true;
      if (skip) return;

      // insert remaining nodes and remove them while they are added to the tree
      for (index = 0; index < nodes[2].length; index++) {

        // add remaining folders in a loop
        t.contains(node => {
          // try {} catch (e) {console.log(e);}

          // do not handle trashed nodes
          if (nodes[2][index] && nodes[2][index].trashed) return;

          // found condition
          if (node.data.id && nodes[2][index].parents && node.data.id === nodes[2][index].parents[0]) {

            // remove node from the remaining folders
            var a = nodes[2].splice(index, 1);

            // console.log(nodes[2][index]);
            console.log(JSON.stringify(a[0]));

            try {

              // add node to the tree
              t.add(a[0], node, t.traverseBF);
            } catch (e) {
              console.log(e, index, a[0], node);
            }
          }
        }, t.traverseBF);
      }

      t.traverseBF(node => {
        console.log(node.data);
      });
    });
}

// get all pdf files recursively not in the root folder
export function getPdfFiles(nextPageToken, files = []) {
  // return getChunkFiles('mimeType = "application/pdf"', nextPageToken)
  return getChunkFiles('mimeType = "application/pdf" and not ("root" in parents)', nextPageToken)
    .then(res => {

      if (res.files) {
        files.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getPdfFiles(res.nextPageToken, files));
      }

      return files;
    });
}

// get the rest of the folders recursively
function getRemainingFolders(nextPageToken, folders = []) {
  // return getChunkFiles('mimeType = "application/vnd.google-apps.folder"', nextPageToken)
  return getChunkFiles('mimeType = "application/vnd.google-apps.folder" and not ("root" in parents)', nextPageToken)
    .then(res => {

      if (res.files) {
        folders.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getRemainingFolders(res.nextPageToken, folders));
      }

      return folders;
    });
}

// get all files[id, name, parents, webContentLink] by query string from drive
function getChunkFiles(q, nextPageToken) {
  let opt = {
    q,
    // fields: 'nextPageToken, files(id, name, parents, webContentLink)',
    fields: 'nextPageToken, files(id, name, trashed, parents)',
    spaces: 'drive', // not necessary
    trashed: false // not necessary
    // useDomainAdminAccess: true, // not necessary
  };

  // has next page token
  if (nextPageToken) {
    opt.pageToken = nextPageToken;
  }

  // send google drive api v3 request
  return gapi.client.drive.files.list(opt)
    .then(resp => {

      // do some validation
      if (resp && resp.status && resp.status === 200 && resp.result && resp.result.files && resp.result.files.length) {
        return resp.result;
      }
    });
}

function getRootPdfFiles(nextPageToken, rootPdfs = []) {
  /* // get root pdf files
  let opt1 = {
    q: '"root" in parents and (mimeType = "application/pdf") and trashed = false',
    spaces: 'drive',
    fields: 'nextPageToken, files(id, name, parents)'
  };
  let opt2 = {
    q: 'mimeType = "application/pdf" and trashed = false and "root" in parents ',
    spaces: 'drive',
    fields: 'files(id, name, parents)'
  }; */
  return getChunkFiles('"root" in parents and (mimeType = "application/pdf") and trashed = false', nextPageToken)
    .then(res => {

      if (res.files) {
        rootPdfs.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getRootPdfFiles(res.nextPageToken, rootPdfs));
      }

      return rootPdfs;
    });
}

function getRootFolders(nextPageToken, rootFolders = []) {
  /* // get all root folders
  let opt = {
    q: 'mimeType = "application/vnd.google-apps.folder" and trashed = false and "root" in parents',
    spaces: 'drive',
    fields: 'files(id, name, parents)'
  }; */

  return getChunkFiles('mimeType = "application/vnd.google-apps.folder" and trashed = false and "root" in parents', nextPageToken)
    .then(res => {

      if (res.files) {
        rootFolders.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getRootPdfFiles(res.nextPageToken, rootFolders));
      }

      return rootFolders;
    });
}

export function getAccessToken() {
  return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
}

/**
 * get single file by id
 * nodejs example url: https://developers.google.com/drive/v3/web/manage-downloads
 */
export function getFileById(fileId) {

  // or this: gapi.auth.getToken().access_token;
  const accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;

  // ?access_token = ' + encodeURIComponent(oauthToken))
  // return gapi.client.drive.files.get({
  //   fileId: fileId,
  //   alt: 'media'
  // });

  // example here: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&&access_token=${accessToken}`)
    .then(response => {
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
        });
      }
      throw new Error('Network response was not ok.');
    })
    .then(stream => new Response(stream))
    // .then(response => response.blob());
    .then(response => new Blob([response], { type: 'application/pdf' }));
  // .then(blob => URL.createObjectURL(blob));
}
