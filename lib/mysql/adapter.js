'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

var mysql = require('mysql');
var febs  = require('febs');
var database_connection = require('./database_connection');
var assert   = require('assert');

module.exports = {
  createPool:   createPool,
  getClient:    getClient,
  getConnection:getConnection,
  query:        query,
  querySync:    querySync,
}


/**
* @desc: create connection pool.
* @return: 
*/
function createPool(opt) {
  return mysql.createPool(opt);
}

/**
* @desc: get db client.
* @return: 
*/
function getClient(pool) {
  return pool;
}

/**
 * @desc: get the connection for transaction.
 * @return: database_connection. return null hint error.
 */
function* getConnection(pool, ctx) {
  try {
    let ret = yield febs.utils.denodeify(pool.getConnection, pool)();
    return ret ? (new database_connection(ret, ctx)) : null;
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
function* query(pool, errHandler, queryTimeout, sql, values, conn) {
  assert(!febs.string.isEmpty(sql));
  try {
    if (!conn)  { conn = yield febs.utils.denodeify(pool.getConnection, pool)(); needRelease = true; }
    if (!conn)  return false;
  } catch (e) { return false; }

  try {
    var ret = yield febs.utils.denodeify(conn.query, conn)({sql:sql, values:values, timeout:timeout});
    return ret;
  } catch (e) {
    errHandler(sql, e, __filename, __line);
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
function querySync(pool, errHandler, queryTimeout, sql, value, cb, conn ) {
  assert(!febs.string.isEmpty(sql));
  try {
    if (!conn) {
      pool.getConnection(function(err, connection){
        if (err) { cb(err, null); return; }
        connection.query({sql:sql, values:values, timeout:queryTimeout}, function(err, ret) {
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
      conn.query({sql:sql, values:values, timeout:queryTimeout}, function(err, ret) {
        if (ret) {
          cb(null, ret);
        }
        else {
          cb(err, null);
        }
      });
    } // if...else.

  } catch (e) {
    errHandler(sql, e, __filename, __line);
  }
}
