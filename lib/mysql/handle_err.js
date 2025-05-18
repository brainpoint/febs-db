'use strict';
/**
* Copyright (c) 2017 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

var exception = require('../exception');

/**
* @desc: 处理异常
*/
module.exports = function(sql, e, filename, line) {
  if (__debug)
  {
    console.log(filename, line);
    console.log(e);
    console.log(sql);
  }

  if (e.code && (e.code == 'ENOTFOUND' || e.code == 'ETIMEDOUT' || e.code == 'PROTOCOL_SEQUENCE_TIMEOUT' || e.code == 'ENETUNREACH' || e.code == 'EHOSTUNREACH' || e.code == 'ECONNREFUSED' || e.code == 'ER_BAD_DB_ERROR'))
  {
    return new exception(sql, exception.DB_ConnectException, filename, line);
  }
  else if (e.code && (e.code == 'ER_BAD_FIELD_ERROR'))  // 更多的错误代号未列出.
  {
    return new exception(sql, exception.DB_SqlException, filename, line);
  }
  else
  {
    return e; //new exception(sql + '\n' + e.toString(), exception.DB_CommonException, filename, line);
  }
}