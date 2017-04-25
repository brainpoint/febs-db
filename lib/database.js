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

module.exports = class {
  constructor(dbtype, opt) {

    // dbtype.
    if (dbtype.toLowerCase() != 'mysql') {
      throw new febs.exception('only support to mysql', febs.exception.PARAM, __filename, __line);
    }

    // create.
    this.pool = mysql.createPool(opt);

    this.queryTimeout = opt.queryTimeout || 5000;
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
      let ret = yield febs.utils.denodeify(this.pool.getConnection, this.pool)();
      return ret ? (new database_connection(ret, this)) : null;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  /**
  * @desc: 执行sql语句.
  * @param values: 传递的参数.
  * @return: 错误返回false. 正确返回结果.
  */
  *query(sql, values, conn) {
    assert(!febs.string.isEmpty(sql));
    try {
      if (!conn)  { conn = yield febs.utils.denodeify(this.pool.getConnection, this.pool)(); needRelease = true; }
      if (!conn)  return false;
    } catch (e) { return false; }

    try {
      var ret = yield febs.utils.denodeify(conn.query, conn)({sql:sql, values:values, timeout:this.queryTimeout});
      return ret;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return false;
    } finally {
      if (needRelease)  conn.release();
    }
  }

  /**
  * @param cb: cb(err, ret)  {}
  * @param values: 传递的参数.
  * @return: void
  */
  querySync( sql, value, cb, conn ) {
    assert(!febs.string.isEmpty(sql));
    try {
      let ctx = this;
      if (!conn) {
        ctx.pool.getConnection(function(err, connection){
          if (err) { cb(err, null); return; }
          connection.query({sql:sql, values:values, timeout:ctx.queryTimeout}, function(err, ret) {
            connection.release();
            if (ret) {
              cb(null, ret);
            }
            else {
              cb(err, null);
            }
          });
        });
      } else {   
        conn.query({sql:sql, values:values, timeout:ctx.queryTimeout}, function(err, ret) {
          if (ret) {
            cb(null, ret);
          }
          else {
            cb(err, null);
          }
        });
      } // if...else.

    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }

};
