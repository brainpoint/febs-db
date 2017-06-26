'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */

const assert     = require('assert');
const febs       = require('febs');
const copy       = require('copy-to');
const exception  = require('./exception');
const mysqlAdapter = require('./mysql/adapter');
const mssqlAdapter = require('./mssql/adapter');
const condition    = require('./condition');
const tablebase    = require('./tablebase');

module.exports = class { 

  constructor(dbtype, opt) {
    this._dbtype = dbtype;
    // dbtype.
    if (dbtype.toLowerCase() == 'mysql') {
      this.adapter = mysqlAdapter;
    } 
    else if (dbtype.toLowerCase() == 'mssql') {
      this.adapter = mssqlAdapter;
    } 
    else {
      throw new exception('not support this db', febs.exception.PARAM, __filename, __line);
    }

    // create.
    opt = this.adapter.opt_cvt(opt);
    this.opt = opt;
    this.pool = this.adapter.createPool(opt);
    this.queryTimeout = opt.queryTimeout;

    this.adapter.errHandle(this, this.pool);
  }

  /**
  * @desc: 数据库类型.
  * @return: 'mysql' / 'mssql'.
  */
  get dbtype() {
    return this._dbtype;
  }

  /**
  * @desc: 设置执行sql的log回调. 每次执行数据库查询都将调用此方法.
  * @param cb: function(err, sql) {}
  */
  set sqlLogCallback(cb) {
    if (typeof cb !== 'function') {
      throw new exception('param is not a funciton', febs.exception.PARAM, __filename, __line);
    }
    this.logCallback = cb;
  }
  get sqlLogCallback() { return this.logCallback; }

  /**
  * @desc: 对likeSql进行转义操作.
  * @return: string.
  */
  escapeLike(likeSql) { return this.adapter.escape_like(likeSql); }

  /**
  * @desc: type cast, 为指定类型和值返回正确的sql值.
  * @return: 传入不配对的value与type,可引发异常.
  */
  type_cast(type, value) { return this.adapter.type_cast(value, type); }

  /**
  * @desc: 注册表格.
  * @param mapName: 在数据库中真实的表名.
  */
  registerTable(table, mapName = null) {
    assert(table);
    var tableDest = {};
    copy(table).to(tableDest);
    tableDest.__proto__ = table.__proto__;
    tableDest._condition = new condition(this.adapter, tableDest.model);
    tableDest._adapter = this.adapter;
    tableDest._db    = this;
    this[tableDest._tablename] = tableDest;
    tableDest._mapName = mapName;
  }

  /**
  * @desc: 执行sql语句.
  * @return: Promise.
  * @resolve:
  *     ret - 查询结果.
  */
  exec(sql) {
    return this.adapter.exec(this, this.pool, sql, this._transactionConn);
  }

  /**
  * @desc: 执行存储过程.
  * @param name: procedure name.
  * @param procedureParams: in,out参数; 使用 procedureParams对象.
  * @return: Promise.
  * @resolve:
  *     ret - 查询结果,out参数存储至其中.
  */
  execProcedure(name, procedureParams) {
    return this.adapter.execProcedure(this, this.pool, name, procedureParams, this._transactionConn);
  }

  /**
  * @desc: transaction.
  * @param isolationLevel: 事务级别.
  * @param taskCB: async function(db):boolean {}; 返回false则rollback, 返回true则commit.
  * @return: Promise.
  * @resolve:
  *     ret - 是否成功提交.
  */
  transaction(isolationLevel, taskCB) {
    return this.adapter.transaction(this, isolationLevel, taskCB);
  }

  _cloneWithConn(conn) {
    assert(conn);
    var dest = {};
    copy(this).to(dest);
    dest.__proto__ = this.__proto__;
    dest._transactionConn = conn;
    dest.pool = null;

    for (let ta in dest) {
      if (dest[ta] instanceof tablebase) {
        dest.registerTable(dest[ta], dest[ta]._mapName);
      }
    }

    return dest;
  }
  _destroy() {
    for (let ta in this) {
      if (this[ta] instanceof tablebase) {
        this[ta]._db = null;
      }
      delete this[ta];
    }
    this._transactionConn = null;
  }
};
