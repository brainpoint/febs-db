'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */

var exception = require('febs').exception;

/**
* @desc: 为简化异常系统, 使用code来表明异常的类型. 由应用层来派生异常.
*/
module.exports = class extends exception {
  constructor(msg, code, filename, line) {
    super('Febs-db: ' + msg, code, filename, line);
  }

  /**
  * @desc: 通用错误.
  */
  static get DB_CommonException() { return 'DB_CommonException'; }

  /**
  * @desc: 数据查询条件错误。sql语句问题;
  */
  static get DB_SqlException() { return 'DB_SqlException'; }

  /**
  * @desc: 数据库连接问题;
  */
  static get DB_ConnectException() { return 'DB_ConnectException'; }

  /**
  * @desc: 数据库查询时产生的问题, 可能是数据库服务器问题, 或是并发产生的事务锁问题等;
  */
  static get DB_QueryException() { return 'DB_QueryException'; }
};