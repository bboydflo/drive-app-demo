import _ from 'underscore';
import isPojo from 'is-pojo';
import getProp from 'get-prop';
import SmartPigsError from './smartpigs-base-error';

export default (dbConnection = null) => ({

  fetchServer: (endPoint, layout) => {
    return fetch(endPoint, {
      method: 'POST',
      body: JSON.stringify(layout),
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
      throw new SmartPigsError('connection error', 0);
    });
  },

  fetchDatabase: (tableName, queryOptions) => {
    return dbConnection && dbConnection.then(connection => connection.getRowsBy(tableName, queryOptions));
  },

  /**
   * unified method to get spread data. supports server or local db source.
   * this method does not check the provided arguments are correct. assumes they are
   * @param {string} serverUrl - end point url
   * @param {object} data - data to be sent to the server
   * @param {string} dbStore - local db store name
   */
  getSpreadData: (serverUrl, layout, tableName, queryOptions) => {
    return new Promise((resolve, reject) => {
      let p;

      // if no db store => fetch data from the server url
      if (!tableName) {

        // get data from the server
        p = this.fetchServer(serverUrl, layout);
      } else {

        // get data from the local db
        p = this.fetchDatabase(tableName, queryOptions);
      }

      // data has been fetched from src
      p.then(data => {

        // define new data obj
        let dataObj = {};

        // list | find
        let mainMode = getProp(layout, ['mainMode'], false);

        // if (isPlainObject(data)) {
        if (isPojo(data)) {

          // check for new layout
          let nLayout = getProp(data, ['layout']);

          // if new layout -> update default layout name
          // let lName = nLayout ? endPoint : layout.requestKey;

          // get rows and animals
          dataObj.rows = getProp(data, ['tr'], []);
          dataObj.animals = getProp(data, ['animals', 'tr'], []);

          /* // normalize data object
          dataObj.rows = _.map(dataObj.rows, (row, idx) => TableView.prototype.normalizeRow(row, idx, lName));
          dataObj.animals = _.map(dataObj.animals, (row, idx) => {

            // make row as an animal row
            row.animal = 1;

            // return TableView.prototype.normalizeRow(row, idx, layout.requestKey);
            return TableView.prototype.normalizeRow(row, idx, lName);
          }); */

          // resolve promise
          return resolve([dataObj, layout, nLayout]);
        }

        // process response from the local db
        if (_.isArray(data)) {

          // find mode
          if (mainMode === 1) {
            dataObj.rows = _.filter(data, r => r.animal === 0);
            dataObj.animals = _.filter(data, r => r.animal === 1);
          } else {
            dataObj.rows = data;
            dataObj.animals = [];
          }

          // resolve promise
          return resolve([dataObj, data, false]);
        }

        // add support for report list response
        if (_.isString(data) && data.substring(data.length - 3) === 'pdf') {

          // resolve promise
          return resolve([data, layout, false]);
        }

        // unknown response
        reject(new SmartPigsError('unknown response', 1));
      }).catch(err => {

        // in development
        if (process.env.NODE_ENV !== 'production') {
          console.error(err);
        }

        // rethrow err -> handle it in other parts of the app
        reject(err);
      });
    });
  },

  /**
   * generic parsing of data requests responses
   * most of the times a json string is expected, but PigVision responses can start
   * with '!' or '?'. local db responses are usually an array. other valid response
   * types can be of type string, number (row id) or array.
   */
  parseServerResponse: function (serverResponse) {
    let error;

    if (!serverResponse) {
      error = new Error('no response');
      error.code = 1;
      return error;
    }

    if (_.isString(serverResponse)) {

      // PigVision error
      if (serverResponse[0] === '!' || serverResponse[0] === '?') {

        // get PigVision error message
        serverResponse = serverResponse.substring(1, serverResponse.length);

        if (serverResponse === 'nouser') {
          error = new Error('session expired');
          error.code = 2;
          return error;
        }

        // other kind of errors
        error = new Error(serverResponse);
        error.code = 3;
        return error;
      }

      if (serverResponse.slice(-3) === 'pdf') {
        return serverResponse;
      }
    }

    try {
      return JSON.parse(serverResponse);
    } catch (e) {
      error = new Error(serverResponse);
      error.code = 5;
      return error;
    }
  },

  /**
   * rows to be normalized
   * viewMode -> 0 (list mode)
   * viewMode -> 1 (find mode, that means they belong to animals list)
   */
  normalizeRows: (rows, viewMode = 0, layout) => {
    return rows.map((r, idx) => {
      let id = r.data[r.data.length - 2];
      return Object.assign({}, r, {
        id,
        layout,
        isDirty: 0,
        rIndex: idx,
        animal: viewMode
      });
    });
  }
});
