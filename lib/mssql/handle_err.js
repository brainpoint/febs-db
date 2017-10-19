'use strict';
/**
* Copyright (c) 2017 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

var mssql     = require('mssql');
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

  if (
    (e.code && (e.code == 'ELOGIN' || e.code == 'ETIMEOUT' || e.code == 'ESOCKET' || e.code == 'ENOCONN' || e.code == 'ENOTOPEN' || e.code == 'ECONNCLOSED' || e.code == 'EHOSTUNREACH'))
    ||
    e instanceof mssql.ConnectionError
    )
  {
    return new exception(sql, exception.DB_ConnectException, filename, line);
  }
  else if (
    (e.code == 'EREQUEST')
    ||
    e instanceof mssql.PreparedStatementError
    )
  {
    return new exception(sql, exception.DB_SqlException, filename, line);
  }
  else if (
    e instanceof mssql.RequestError
    || e instanceof mssql.TransactionError
    ) 
  {
    return new exception(sql, exception.DB_QueryException, filename, line);
  }
  else
  {
    return new exception(sql + '\n' + e.toString(), exception.DB_CommonException, filename, line);
  }
}

