'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */

var mysql   = require('mysql');
var exception = require('./exception');
var citong   = require('citong');

module.exports = class {
  constructor(conn) {
    this.conn = conn;
  }

  /**
  * @desc: transaction. only can do transaction once.
  * @param taskCB: function*():boolean {}
  * @return: boolean.
  */
  *transaction(taskCB) {
    try {
      var ret = yield citong.utils.denodeify(this.conn.query, this.conn)('START TRANSACTION');
      if (global.isDebug)
      {
        console.log('[START TRANSACTION] ' + (ret?"ok":"err"));
      }
      if (ret) {
        var r = yield* taskCB();
        if (r)
        {
          r = yield this._commit();
          return r;
        }
        else
        {
          yield this._rollback();
          return false;
        }
      } else {
        this.conn.release();
        this.conn = null;
        return false;
      }
    } catch (e) {
      this._handleErr('[TRANSACTION exception]' , e, __filename, __line);
      
      if (this.conn && !(e.code == 'ENOTFOUND' || e.code == 'ETIMEDOUT' || e.code == 'PROTOCOL_SEQUENCE_TIMEOUT')) {
        yield this._rollback();
      }
      return false;
    }
  }

  /**
  * @desc: transaction.
  * @return: boolean.
  */
  *_commit() {
    try {
      var r = yield citong.utils.denodeify(this.conn.query, this.conn)('COMMIT');//yield citong.utils.denodeify(this.conn.commit, this.conn)();
      if (global.isDebug)
      {
        console.log('[COMMIT] ' + (r?"ok":"err"));
      }
      this.conn.release();
      this.conn = null;
      return r ? true : false;
    } catch (e) {
      var c = this.conn;
      yield this._rollback();
      //this.conn.rollback(function(){ c.release(); this._handleErr('_commit' , e, __filename, __line);});
      return false;
    }
  }

  /**
  * @desc: transaction.
  */
  *_rollback() {
    try {
      var r = yield citong.utils.denodeify(this.conn.query, this.conn)('ROLLBACK');
      if (global.isDebug)
      {
        console.log('[ROLLBACK] ' + (r?"ok":"err"));
      }
      this.conn.release();
      this.conn = null;
      //var c = this.conn;
      //this.conn.rollback(function(){ c.release(); });
    } catch (e) {
      this.conn.release();
      this.conn = null;
    }
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
      //throw new exception(sql, exception.DB_ERROR_CONNECT, filename, line);
    }
    else
    {
      //throw new exception(sql, exception.DB_ERROR, filename, line);
    }
  }
};
