import _ from 'underscore';
// import clone from 'clone';
import Tree from './simple-tree';
import isPojo from 'is-pojo';

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

function renderStructure(node, indentation = '') {
  let i, fileType;
  if (node && node.data && node.data.id) {
    if (node.children && node.children.length) {
      fileType = '►';
    } else {
      fileType = '▬';
    }

    // if (node.data.id !== 'root') {
    if (node.data.name !== 'root') {

      // log
      console.log(indentation + fileType + ' ' + (node.data.name || node.data.id) + '\n');
    }

    if (node.children && node.children.length) {
      for (i = 0; i < node.children.length; i++) {
        renderStructure(node.children[i], indentation + ' ');
      }
    }
  }
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
  gapi.client.drive.files.list({ q: 'mimeType = "application/vnd.google-apps.folder"', fields: 'nextPageToken, files(id, name, parents)', spaces: 'drive'}); */

  // skip old implementation
  let skipOld = true;

  if (skipOld) {

    // new implementation
    return getRootId()
      .then(rootId => {

        // minimal root id validation
        if (typeof rootId === 'undefined') return;

        return smartQuery()
          .then(nodes => {

            // create files and folders tree
            var t = new Tree({ id: rootId, name: 'root' });

            // add 2 children to the root node
            // t.add({ id: 'drive' }, 'root', t.traverseBF);
            // t.add({ id: 'shared' }, 'root', t.traverseBF);
            t.add({ id: 'drive' }, rootId, t.traverseBF);
            t.add({ id: 'shared' }, rootId, t.traverseBF);

            let index;
            let len = nodes.length;

            // add remaining nodes
            while (len > 0) {
            // while (nodes.length > 0) {

              // insert remaining nodes and remove them while they are added to the tree
              for (index = 0; index < nodes.length; index++) {

                // add remaining folders in a loop
                t.contains(node => {
                  var a;

                  // check if node.data.id is included in the list of parents of nodes[index]
                  if (nodes[index] && _.contains(nodes[index].parents, node.data.id)) {

                    // get exact parent id index
                    let parentIdIdx = nodes[index].parents.indexOf(node.data.id);

                    // get parent id
                    let parentId = nodes[index].parents[parentIdIdx];

                    // remove node from the remaining folders
                    a = nodes.splice(index, 1);

                    // update length
                    len = len - 1;

                    // add node to the tree
                    // t.add(a[0], node.data.id, t.traverseBF);
                    t.add(a[0], parentId, t.traverseBF);
                  }
                }, t.traverseBF);
              }
            }

            // render the tree structure
            t.traverseBF(node => {
              if (node && node.data && node.data.name === 'root') {
                renderStructure(node);
              }
            });
          });
      });
  }

  return Promise.all([
    getRootFolders(),
    getRootPdfFiles(),
    getSharedFolders(),
    getSharedPdfFiles(),
    getRemainingFolders(),
    getRemainingPdfFiles()
  ])
    .then(nodes => {

      // create files and folders tree
      var t = new Tree({ id: 'root' });

      // add 2 children to the root node
      t.add({ id: 'drive' }, 'root', t.traverseBF);
      t.add({ id: 'shared' }, 'root', t.traverseBF);

      // nodes[0] = root folders
      // nodes[1] = root pdf files
      // nodes[2] = shared folders
      // nodes[3] = get shared pdf files
      // nodes[4] = remaining folders (not directly inside root folder)
      // nodes[5] = remaining pdf files (not directly inside root folder) and not shared with anyone (visibility = "limited")

      var len, index;

      // add root folders
      for (index = 0; index < nodes[0].length; index++) {
        t.add(nodes[0][index], 'root', t.traverseBF);
      }

      // add root pdf files
      for (index = 0; index < nodes[1].length; index++) {
        t.add(nodes[1][index], 'root', t.traverseBF);
      }

      // add shared folders
      for (index = 0; index < nodes[2].length; index++) {
        t.add(nodes[2][index], 'shared', t.traverseBF);
      }

      // add shared pdf files
      for (index = 0; index < nodes[3].length; index++) {
        t.add(nodes[3][index], 'shared', t.traverseBF);
      }

      // get initial length of remaining folders
      len = nodes[4].length;

      // add remaining folders
      while (len > 0) {

        // insert remaining nodes and remove them while they are added to the tree
        for (index = 0; index < nodes[4].length; index++) {

          // add remaining folders in a loop
          t.contains(node => {
            var a;

            // check if node.data.id is included in the list of parents of nodes[4][index]
            if (nodes[4][index] && _.contains(nodes[4][index].parents, node.data.id)) {

              // remove node from the remaining folders
              a = nodes[4].splice(index, 1);

              // update length
              len = len - 1;

              // console.log(nodes[4][index]);
              // console.log(JSON.stringify(a[0]));

              try {

                // add node to the tree
                t.add(a[0], node.data.id, t.traverseBF);
              } catch (e) {
                console.log(e, index, a[0], node);
              }
            } else {
              if (isPojo(nodes[4][index]) && !nodes[4][index].hasOwnProperty('parents')) {
                a = nodes[4].splice(index, 1);

                try {

                  // add node to the tree
                  t.add(a[0], 'root', t.traverseBF);
                  len = len - 1;
                } catch (e) {
                  console.log(e, index, a[0], node);
                }
              }
            }
          }, t.traverseBF);
        }
      }

      // get initial length of remaining pdf files
      len = nodes[5].length;

      // add remaining pdf files
      while (len > 0) {

        // insert remaining nodes and remove them while they are added to the tree
        for (index = 0; index < nodes[5].length; index++) {

          // add remaining pdf files
          t.contains(node => {
            var a;

            // check if node.data.id is included in the list of parents of nodes[5][index]
            if (nodes[5][index] && _.contains(nodes[5][index].parents, node.data.id)) {

              // remove node from the list
              a = nodes[5].splice(index, 1);

              // update length
              len = len - 1;

              // add node to the tree
              t.add(a[0], node.data.id, t.traverseBF);
            } else {
              if (isPojo(nodes[5][index]) && !nodes[5][index].hasOwnProperty('parents')) {
                a = nodes[5].splice(index, 1);

                // add node to the tree as a child of the root node
                t.add(a[0], 'root', t.traverseBF);
              }
            }
          }, t.traverseBF);
        }
      }

      // render the tree structure
      t.traverseBF(node => {
        if (node && node.data && node.data.id === 'root') {
          renderStructure(node);
        }
      });
    });
}

function getRootFolders(nextPageToken, rootFolders = []) {
  /* // get all root folders
  let opt = {
    q: 'mimeType = "application/vnd.google-apps.folder" and trashed = false and "root" in parents',
    spaces: 'drive',
    fields: 'files(id, name, parents)'
  }; */

  // add `and visibility = "limited"` to see only the private folders
  return getChunkFiles('"root" in parents and mimeType = "application/vnd.google-apps.folder" and trashed = false', nextPageToken)
    .then(res => {
      if (typeof res === 'undefined') return rootFolders;

      if (res.files) {
        rootFolders.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getRootFolders(res.nextPageToken, rootFolders));
      }

      return rootFolders;
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
  return getChunkFiles('"root" in parents and mimeType = "application/pdf" and trashed = false', nextPageToken)
    .then(res => {
      if (typeof res === 'undefined') return rootPdfs;

      if (res.files) {
        rootPdfs.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getRootPdfFiles(res.nextPageToken, rootPdfs));
      }

      return rootPdfs;
    });
}

function getSharedFolders(nextPageToken, sharedFolders = []) {
  return getChunkFiles('sharedWithMe and mimeType = "application/vnd.google-apps.folder" and trashed = false', nextPageToken)
    .then(res => {
      if (typeof res === 'undefined') return sharedFolders;

      if (res.files) {
        sharedFolders.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getSharedFolders(res.nextPageToken, sharedFolders));
      }

      return sharedFolders;
    });
}

// get only shared pdf files
function getSharedPdfFiles(nextPageToken, files = []) {

  // 'mimeType = "application/pdf" and sharedWithMe'
  // 'mimeType = "application/pdf" and sharedWithMe and not ("root" in parents)' -> faster
  // 'sharedWithMe and mimeType = "application/pdf" and not ("root" in parents)'
  return getChunkFiles('sharedWithMe and mimeType = "application/pdf" and trashed = false and not ("root" in parents)', nextPageToken)
    .then(res => {
      if (typeof res === 'undefined') return files;

      if (res.files) {
        files.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getSharedPdfFiles(res.nextPageToken, files));
      }

      return files;
    });
}

// get the rest of the folders recursively
function getRemainingFolders(nextPageToken, folders = []) {
  // return getChunkFiles('mimeType = "application/vnd.google-apps.folder"', nextPageToken)
  // visibility = "limited" -> private folders
  // {
  //   q: 'mimeType = "application/vnd.google-apps.folder" and trashed = false and "me" in owners',
  //   fields: 'files(id, name, owners, shared, trashed, parents)',
  //   corpora: 'user',
  //   ownedByMe: true
  // }
  return getChunkFiles('mimeType = "application/vnd.google-apps.folder" and trashed = false and "me" in owners and not ("root" in parents)', nextPageToken)
    .then(res => {
      if (typeof res === 'undefined') return folders;

      if (res.files) {
        folders.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getRemainingFolders(res.nextPageToken, folders));
      }

      return folders;
    });
}

// get all remaining pdf files recursively not in the root folder and not shared with me
function getRemainingPdfFiles(nextPageToken, files = []) {
  // return getChunkFiles('mimeType = "application/pdf"', nextPageToken)
  // 'mimeType = "application/pdf" and not ("root" in parents)'
  // visibility = "limited" -> private pdf files
  return getChunkFiles('mimeType = "application/pdf" and trashed = false and visibility = "limited" and "me" in owners and not ("root" in parents)', nextPageToken)
    .then(res => {
      if (typeof res === 'undefined') return files;

      if (res.files) {
        files.push(...res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(getRemainingPdfFiles(res.nextPageToken, files));
      }

      return files;
    });
}

// get all files[id, name, parents, shared, trashed, webContentLink] by query string from drive
function getChunkFiles(q, nextPageToken) {
  let opt = {
    q,
    // fields: 'nextPageToken, files(id, name, parents, webContentLink)',
    fields: 'nextPageToken, files(id, name, shared, trashed, owners, parents)'
    // spaces: 'drive', // not necessary
    // trashed: false // not necessary
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

function getList(opt, nextPageToken) {
  if (nextPageToken) {
    opt.pageToken = nextPageToken;
  }

  // update default options
  let o = Object.assign({
    q: '"root" in parents',
    fields: 'nextPageToken, files(id, name, parents)'
  }, opt);

  // send google drive api v3 request
  return gapi.client.drive.files.list(o)
    .then(resp => {

      // do some validation
      if (resp && resp.status && resp.status === 200 && resp.result && resp.result.files && resp.result.files.length) {
        return resp.result;
      }
    });
}

function getRootId() {

  // send google drive api v3 request
  return gapi.client.drive.files.get({ fileId: 'root' }).then(resp => {

    // do some validation
    if (resp && resp.status && resp.status === 200 && resp.result && resp.result.id) {
      return resp.result.id;
    }
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

// fetch all folders and pdf files that are not in root, not trashed
export function smartQuery(nextPageToken, files = []) {

  /**
   * observations about this query
   * trashed nodes still appear -> filter trashed nodes
   * files with mimeType = "application/pdf" also have fileExtension = "pdf"
   * files with mimeType = "application/vnd.google-apps.folder" do not have fileExtension attribute
   * every node that has attribute ownedByMe = false and shared = true should go into shared with me branch
   * some nodes do not have any parents -> add them to the root folder
   */
  return getList({
    q: 'mimeType = "application/pdf" or mimeType = "application/vnd.google-apps.folder" and trashed = false and not ("root" in parents)',
    fields: 'nextPageToken, files(id, name, shared, trashed, owners, ownedByMe, mimeType, fileExtension, parents)'
  }, nextPageToken)
    .then(res => {
      if (typeof res === 'undefined') return files;

      if (res.files) {

        // filter removed items or items that do not have any parents
        files = files.filter(node => {
          if (node && (node.trashed || !node.hasOwnProperty('parents') || node.parents.length === 0)) return false;
          return true;
        });

        // save correct list items
        // files.push(...res.files);
        files = files.concat(res.files);
      }

      if (res.nextPageToken) {
        return Promise.resolve(smartQuery(res.nextPageToken, files));
      }

      return files;
    });
}
