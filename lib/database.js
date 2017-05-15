'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */

var mysql   = require('mysql');
var febs   = require('febs');
var database_connection = require('./database_connection');
var assert   = require('assert');

var exception = require('./exception');

var mysqlAdapter = require('./mysql/adapter');

module.exports = class { 

  constructor(dbtype, opt) {
    // dbtype.
    if (dbtype.toLowerCase() == 'mysql') {
      this.adapter = new mysqlAdapter;
    } else if (dbtype.toLowerCase() == 'mssql') {
      //this.adapter = new mysqlAdapter;
    } else {
      throw new febs.exception('not support this db', febs.exception.PARAM, __filename, __line);
    }

    // create.
    this.pool = this.adapter.createPool(opt);

    this.queryTimeout = opt.queryTimeout || 5000;
  }

  get client() {
    return this.adapter.client(this.pool);
  }

  /**
   * @desc: get the connection for transaction.
   * @return: database_connection.
   */
  *getConnection() {
    return yield this.adapter.getConnection(this.pool, this);
  }

  /**
  * @desc: 执行sql语句.
  * @param values: 传递的参数.
  * @return: 错误返回false. 正确返回结果.
  */
  *query(sql, values, conn) {
    return yield this.adapter.query(this.pool, this._handleErr, this.queryTimeout, sql, values, conn);
  }

  /**
  * @param cb: cb(err, ret)  {}
  * @param values: 传递的参数.
  * @return: void
  */
  querySync( sql, value, cb, conn ) {
    return querySync(this.pool, this._handleErr, this.queryTimeout, sql, value, cb, conn);
  }

  /**
  * @desc: 处理异常
  */
  _handleErr(sql, e, filename, line) {
    if (global.isDebug)
    {
      console.log(e);
      console.log(sql);
      console.log(filename, line);
    }

    if (e.code == 'ENOTFOUND' || e.code == 'ETIMEDOUT' || e.code == 'PROTOCOL_SEQUENCE_TIMEOUT')
    {
      throw new exception(sql, exception.DB_ERROR_CONNECT, filename, line);
    }
    else
    {
      throw new exception(sql, exception.DB_ERROR, filename, line);
    }
  }
};
