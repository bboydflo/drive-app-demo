import _ from 'underscore';
import ErrorTypes from './error-types';
import SmartPigsError from './smartpigs-base-error';

// module vars
let dbConnections;

export default (Dexie, isProduction) => {

  // cache underscore methods
  let map = _.map;

  if (isProduction) {

    // update dexie debug
    Dexie.debug = false;
  }

  // default db connections list
  dbConnections = dbConnections || [];

  class DexieWrapper {
    constructor () {

      // init db
      this.db = null;
    }

    create (dbName, schema) {

      // check database
      if (this.db) {

        // check if db is open
        if (this.db.isOpen()) {

          // resume
          return Promise.resolve(this.db);
        }
      } else {

        // get database properties
        this.db = new Dexie(dbName);

        // more examples here: http://dexie.org/docs/Version/Version.stores()
        this.db.version(1).stores(schema);
      }

      // open database -> returns a promise
      return this.db.open();
    }

    // not used
    closeDb () {

      // create database instance if doesn't already exist
      // this.db = this.db || new Dexie(this.dbName);

      // close database connection
      this.db.close();
    }

    /**
     * puts item in a store / updates an item if already exists
     * @param  {string} store - store name
     * @param  {object} data - data to be updated
     * @return {promise} - return promise
     */
    updateRow (table, row) {

      // continue operation
      // check docs: http://dexie.org/docs/Table/Table.put().html
      return this.db[table].put(row);
    }

    // example here: https://github.com/dfahlander/Dexie.js/wiki/WriteableTable.bulkPut()
    updateRows (table, rows) {

      // bulk put
      return this.db[table].bulkPut(rows);
    }

    /**
     * will get items from store. optionally specify
     * key, operation, value and count
     * @return {promise} - return promise
     */
    get (table, layout, key, operation, value) {

      // check operation
      if (operation === '<') {

        // update value
        value -= 1;
      }

      // check operation
      if (operation === '>') {

        // update value
        value += 1;
      }

      // query object
      let query = { layout: layout };

      // update query object
      query[key] = value;

      // get rows
      return this.db[table].where(query).toArray();
    }

    // TODO: change signature to support other where clauses
    getRowsBy (table, options) {

      // get rows
      return this.db[table].where(options).toArray();
    }

    /**
     * count store
     * @param  {string} store - store name
     * @return {promise} - returns database request promise
     */
    countBy (table, options) {

      // count
      return this.db[table].where(options).count();
    }

    countAll (table) {

      // count
      return this.db[table].count();
    }

    /**
     * get first row by query options
     */
    getRowBy (table, options) {

      // returns promise
      return this.db[table].where(options).first();
    }

    deleteRowBy (table, options) {

      // delete row by id
      return this.db[table].where(options).delete();
    }

    /**
     * delete rows from a table by queryoptions
     * @param  {string} table - table name
     * @param  {object} options - query options
     * @return {promise}
     */
    clearStoreBy (table, options) {

      // clear table
      return this.db[table].where(options).delete();
    }

    /**
     * clear entire table
     * @param  {string} store - store name
     * @param  {function} callback - callback function to call when request
     * has been completed
     * @return {promise} - returns promise
     */
    clearTable (table) {

      // clear table
      return this.db[table].clear();
    }

    /**
     * clear all tables
     * @return {promise} returns a promise
     */
    clearTables (tables) {

      // clear each table one at a time
      const ps = map(tables, table => this.clearTable(table));

      // clear stores
      return Promise.all(ps);
    }

    delete () {
      if (!this.db) {

        // eslint-disable-next-line
        return new Promise.resolve(true);
      }

      // delete database
      return this.db.delete();
    }
  }

  return {
    get: function (name, dbTables) {

      // define connection
      let i, connection;

      // check database connections
      for (i = 0; i < dbConnections.length; i++) {
        if (!connection && dbConnections[i].name === name) {

          // define connection
          connection = dbConnections[i].connection;

          // resume loop
          break;
        }
      }

      // check if there already exists a connection
      if (!connection) {

        // create connection
        connection = new DexieWrapper();

        // add connection to the db connection list
        dbConnections.push({ name, connection });
      }

      // create db schema object based on dbTables type
      let schema = {};

      // define db structures
      let dbStruct1 = 'id, layout, &id, isDirty, hidden, marked, found';
      // var dbStruct1 = 'id, layout, id, isDirty, hidden, marked, found';
      let dbStruct2 = 'number, layout, &number, index, isDirty, uhfrfid, lfrfid';

      // map through dbTables
      map(dbTables, tableAttr => {

        // build table schema based on table type
        schema[tableAttr.name] = tableAttr.type === 0 ? dbStruct1 : dbStruct2;
      });

      // TODO: handle error where the call to this method is made
      return connection
        .create(name, schema)
        .then(dexie => {

          // in development
          if (process.env.NODE_ENV !== 'production') {
            console.log(dexie.verno);
          }

          // resolve promise
          return connection;
        });
      /* .catch(err => {

        // in development
        if (process.env.NODE_ENV !== 'production') {
          console.log(err);
        }

        // rethrow error
        throw err;
      }); */
    },

    remove: function (dbName) {
      let i, dbConnection;

      // define index where dbName was found
      let j = -1;

      // loop through active connection
      for (i = 0; i < dbConnections.length; i++) {

        // check current connection name
        if (dbConnections[i].name === dbName) {

          // save index
          j = i;

          // connection found
          dbConnection = dbConnections[i].connection;
        }
      }

      // check if any connection has been found
      if (j < 0 || (typeof dbConnection === 'undefined')) {

        // throw custom error
        throw new SmartPigsError('Database ' + dbName + ' cannot be removed because was not found!', ErrorTypes.REMOVE_DB_NOT_FOUND, dbName);
      }

      // delete database
      return dbConnection.delete();
    }
  };
};
