'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */

var mysql   = require('mysql');
var citong   = require('citong');
var database_connection = require('./database_connection');

module.exports = class {
  constructor(opt) {
    // create.
    this.pool = mysql.createPool(opt);
  }

  get client() {
    return this.pool;
  }

  /**
   * @desc: get the connection for transaction.
   * @return: database_connection.
   */
  *getConnection() {
    try {
      let ret = yield citong.utils.denodeify(this.pool.getConnection, this.pool)();
      return ret ? (new database_connection(ret)) : null;
    } catch (e) {
      return null;
    }
  }

};
