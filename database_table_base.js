'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */


let citong   = require('citong');
let assert   = require('assert');
let database_connection = require('./database_connection');
let exception = require('./exception');

// update时的自增.
class update_inc {
  constructor(n) {
    assert(Number.isInteger(n));
    this.n = n;
  }
};

// 用于字段=v.
class origin_sql {
  constructor(v) {
    this.v = v;
  }
};

module.exports = class {

  /**
  * @param client: 数据库对象.
  * @param tablename: 本表名.
  * @param model: 本表模型.
  */
  constructor(client, tablename, idKeyName, model) {
    this.client = client;
    this.tablename = tablename;
    this.model = model;
    this.idKeyName = idKeyName;
    this._boolCols = [];
    for (var k in model) {
      let b = model[k];
      if (b.type == undefined || b.type == null)
        throw new Error(tablename + ' model is Error');
      if (b.type === 'boolean')
        this._boolCols.push(k);
    }
  }

  /**
  * @desc: escape
  * @return: str.
  */
  escape( v ) { return this.client.escape(v); }

  /**
  * @desc: 构造一个 key=value的sql条件语句.
  * @return: sql;
  */
  make_condition( key, value ) {
    var sql1 = ' `' + key + '`='  + this._escape_v(key, value) + ' ';
    return sql1;
  }

  /**
  * @desc: 构造一个 key>value的sql条件语句.
  * @return: sql;
  */
  make_condition_more( key, value ) {
    var sql1 = ' `' + key + '`>'  + this._escape_v(key, value) + ' ';
    return sql1;
  }


  /**
  * @desc: 构造一个 key>=value的sql条件语句.
  * @return: sql;
  */
  make_condition_more_equal( key, value ) {
    var sql1 = ' `' + key + '`>='  + this._escape_v(key, value) + ' ';
    return sql1;
  }


  /**
  * @desc: 构造一个 key<=value的sql条件语句.
  * @return: sql;
  */
  make_condition_less_equal( key, value ) {
    var sql1 = ' `' + key + '`<='  + this._escape_v(key, value) + ' ';
    return sql1;
  }


  /**
  * @desc: 构造一个 key<value的sql条件语句.
  * @return: sql;
  */
  make_condition_less( key, value ) {
    var sql1 = ' `' + key + '`<'  + this._escape_v(key, value) + ' ';
    return sql1;
  }


  /**
  * @desc: 构造一个 key<>value的sql条件语句.
  * @return: sql;
  */
  make_condition_not_equal( key, value ) {
    var sql1 = ' `' + key + '`<>'  + this._escape_v(key, value) + ' ';
    return sql1;
  }

  /**
  * @desc: 构造一个 key LIKE value的sql条件语句.
  * @return: sql;
  */
  make_condition_like( key, value ) {
    var v = this.model[key];
    if (!v)
      throw new exception(key + ' is not existed', exception.DB_ERROR_SQL, __filename, __line);

    var sql1 = ' `' + key + '` LIKE ';
    if (v.type == 'text')
    {
      if (v.size && v.size < value.length)
        throw new exception(key + ' is too long: ' + value.length, exception.DB_ERROR_SQL, __filename, __line);

      sql1 += this.escape(value);
    }
    else
    {
      throw new exception(key + ' is not a text', exception.DB_ERROR_SQL, __filename, __line);
    }

    return sql1 + ' ';
  }

  /**
  * @desc: 用于表明update时字段自增n.
  */
  make_update_inc(n) {
    return new update_inc(n);
  }
  /**
  * @desc: 用于表明字段=v, 将不对v进行安全检验.
  */
  make_origin_sql(v) {
    return new origin_sql(v);
  }

  /**
  * @desc: 获得最后一个参数,如果为 database_connection则返回.
  * @return:
  */
  get_conn(args) {
    let conn1 = null;
    if (args.length > 0 && (args[args.length-1] instanceof database_connection))
    {
      conn1 = args[args.length-1];
    }
    return conn1;
  }

  /**
  * @desc: 获得最后一个参数,如果为 db.conn则返回.
  * @return:
  */
  get_conn_db(args) {
    let conn = null;
    if (args.length > 0 && (args[args.length-1] instanceof database_connection) && args[args.length-1].conn)
    {
      conn = args[args.length-1].conn;
    }
    return conn;
  }

  /**
  * @desc: add
  *         the last param can be conn.
  *         (insertId will set to item.id)
  * @return: bool
  */
  *add( item ) {
    let conn = this.get_conn_db(arguments);
    let needRelease = false;

    assert(item != null && item != undefined);
    let sqlv = this._makeCols1(item);
    let sql = "INSERT INTO `" + this.tablename + "` (" + sqlv[0] + ") VALUES(" + sqlv[1] + ")";

    try {
      if (!conn)  { conn = yield citong.utils.denodeify(this.client.getConnection, this.client)(); needRelease = true; }
      if (!conn)  return false;
    } catch (e) { return false; }

    try {
      var ret = yield citong.utils.denodeify(conn.query, conn)(sql);
      if (ret && ret.insertId) {
        item[this.idKeyName] = ret.insertId;
      }
      return ret ? true : false;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return false;
    } finally {
      if (needRelease)  conn.release();
    }
  }

  /**
  * @param cb: cb(err, r:boolean)  {}
  * @return: void
  */
  addSync( item, cb ) {
    let conn = this.get_conn_db(arguments);

    assert(item != null && item != undefined);
    let sqlv = this._makeCols1(item);
    let sql = "INSERT INTO `" + this.tablename + "` (" + sqlv[0] + ") VALUES(" + sqlv[1] + ")";

    var idKeyName = this.idKeyName;
    try {

      if (!conn) {
        this.client.getConnection(function(err, connection){
          connection.query(sql, function(err, ret) {
            connection.release();
            if (ret) {
              if (ret.insertId) {
                item[idKeyName] = ret.insertId;
              }
              cb(null, true);
            }
            else {
              cb(err, false);
            }
          });
        });
      } else {   
        conn.query(sql, function(err, ret) {
          if (ret) {
            if (ret.insertId) {
              item[idKeyName] = ret.insertId;
            }
            cb(null, true);
          }
          else {
            cb(err, false);
          }
        });
      } // if...else.

    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }

  /**
  * @desc: remove
  *         the last param can be conn.
  * @return: bool.
  */
  *remove( where ) {
    let conn = this.get_conn_db(arguments);
    let needRelease = false;
    
    assert(where != null && where != undefined && where.length > 0);
    let sql = "DELETE FROM `" + this.tablename + "` WHERE " + (where);

    try {
      if (!conn)  { conn = yield citong.utils.denodeify(this.client.getConnection, this.client)(); needRelease = true; }
      if (!conn)  return false;
    } catch (e) { return false; }

    try {
      var ret = yield citong.utils.denodeify(conn.query, conn)(sql);
      return ret ? true : false;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return false;
    } finally {
      if (needRelease)  conn.release();
    }
  }


  /**
  * @param cb: cb(err, r:boolean)  {}
  * @return:.
  */
  removeSync( where, cb ) {
    let conn = this.get_conn_db(arguments);

    assert(where != null && where != undefined && where.length > 0);
    let sql = "DELETE FROM `" + this.tablename + "` WHERE " + (where);

    try {
      if (!conn) {
        this.client.getConnection(function(err, connection){
          connection.query(sql, function(err, ret) {
            connection.release();
            if (ret) {
              cb(null, true);
            }
            else {
              cb(err, false);
            }
          });
        });
      } else {   
        conn.query(sql, function(err, ret) {
          if (ret) {
            cb(null, true);
          }
          else {
            cb(err, false);
          }
        });
      } // if...else.
      
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }

  /**
  * @desc: update;  where id = item.id
  *         the last param can be conn.
  * @param item, where.
  * @return: boolean.
  */
  *update( item ) {
    assert(item != null && item != undefined);

    let conn = this.get_conn_db(arguments);
    let needRelease = false;

    let sqlv = this._makeCols2(item);
    let sql = "UPDATE `" + this.tablename + "` SET " + sqlv + " WHERE ";

    var id = item[this.idKeyName];
    if (id)
    {
      if (isNaN(id))
        throw new exception('item.id is not a number', exception.DB_ERROR_SQL, __filename, __line);

      sql += "`" + this.idKeyName + "`=" + id;

      if (arguments.length > 1 && typeof arguments[1] === 'string')
      {
        sql += ' AND (' + (arguments[1]) + ')';
      }
    }
    else {
      if (arguments.length > 1 && typeof arguments[1] === 'string')
      {
        sql += (arguments[1]);
      }
      else {
        throw new exception('no item.id and no where', exception.DB_ERROR_SQL, __filename, __line);
      }
    }

    try {
      if (!conn)  { conn = yield citong.utils.denodeify(this.client.getConnection, this.client)(); needRelease = true; }
      if (!conn)  return false;
    } catch (e) { return false; }

    try {
      var ret = yield citong.utils.denodeify(conn.query, conn)(sql);
      return ret ? true : false;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return false;
    } finally {
      if (needRelease)  conn.release();
    }
  }

  /**
  * @desc: update;  where id = item.id
  *         the last param can be conn.
  * @param item, where, cb.
  *         - cb: function(err, r:boolrean) {}
  * @return:.
  */
  updateSync( item ) {
    assert(item != null && item != undefined);

    let conn = this.get_conn_db(arguments);

    let sqlv = this._makeCols2(item);
    let sql = "UPDATE `" + this.tablename + "` SET " + sqlv + " WHERE ";
    var id = item[this.idKeyName];
    var cb;
    if (id)
    {
      if (isNaN(id))
        throw new exception('item.id is not a number', exception.DB_ERROR_SQL, __filename, __line);

      sql += "`" + this.idKeyName + "`=" + id;
      if (arguments.length > 1 && typeof arguments[1] === 'string')
      {
        sql += ' AND (' + (arguments[1]) + ')';
        cb = arguments[2];
      }
      else {
        cb = arguments[1];
      }
    }
    else {
      if (arguments.length > 1 && typeof arguments[1] === 'string')
      {
        sql += (arguments[1]);
        cb = arguments[2];
      }
      else {
        throw new exception('no item.id and no where', exception.DB_ERROR_SQL, __filename, __line);
      }
    }
    assert(typeof cb === 'function');

    try {
      if (!conn) {
        this.client.getConnection(function(err, connection){
          connection.query(sql, function(err, ret){
            connection.release();
            if (ret) {
              cb(null, true);
            }
            else {
              cb(err, false);
            }
          });
        });
      } else {   
        conn.query(sql, function(err, ret){
          if (ret) {
            cb(null, true);
          }
          else {
            cb(err, false);
          }
        });
      } // if...else.

      
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }

  /**
  * @desc: query by id.
  *         the last param can be conn.
  * @param: id, [query_cols]
  *          - query_cols: [col1,col2], the cols will be query.
  * @return: mod.
  */
  *queryById( id ) {
    assert(id != null && id != undefined);
    if (isNaN(id))
      throw new exception('id is not a number', exception.DB_ERROR_SQL, __filename, __line);

    let conn = this.get_conn_db(arguments);
    let needRelease = false;

    let query_cols;
    if (arguments[1] && (arguments[1] instanceof Array))
      query_cols = arguments[1];
    let query_str = this._makeCols3(query_cols);

    let sql = "SELECT " + query_str + " FROM `" + this.tablename + "` WHERE `" + this.idKeyName + "`=" + id;

    try {
      if (!conn)  { conn = yield citong.utils.denodeify(this.client.getConnection, this.client)(); needRelease = true; }
      if (!conn)  return null;
    } catch (e) { return null; }

    try {
      var ret = yield citong.utils.denodeify(conn.query, conn)(sql);
      // fix boolean col.
      if (ret && ret[0])
      {
        for (let j = 0; j < this._boolCols.length; j++) {
          let k = this._boolCols[j];
          ret[0][k] = (ret[0][k] ? 1==ret[0][k].readUInt8(0) : null);
        }
      }
      return ret ? ret[0] : null;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return null;
    } finally {
      if (needRelease)  conn.release();
    }
  }

  /**
  * @desc: query by id.
  *         the last param can be conn.
  * @param: id, [query_cols], cb
  *          - query_cols: [col1,col2], the cols will be query.
  *          - cb: function(err, ret:mod) {}
  */
  queryByIdSync( id ) {
    assert(id != null && id != undefined);
    if (isNaN(id))
      throw new exception('id is not a number', exception.DB_ERROR_SQL, __filename, __line);

    let conn = this.get_conn_db(arguments);

    let query_cols;
    var cb;
    if (arguments[1] && (arguments[1] instanceof Array))
    {
      query_cols = arguments[1];
      cb = arguments[2];
    }
    else
    {
      cb = arguments[1];
    }
    assert(typeof cb === 'function');

    let query_str = this._makeCols3(query_cols);

    let sql = "SELECT " + query_str + " FROM `" + this.tablename + "` WHERE `" + this.idKeyName + "`=" + id;

    var ctx = this;
    try {
      if (!conn) {
        this.client.getConnection(function(err, connection){
          connection.query(sql, function(err, ret){
            connection.release();
            // fix boolean col.
            if (ret && ret[0])
            {
              for (let j = 0; j < ctx._boolCols.length; j++) {
                let k = ctx._boolCols[j];
                ret[0][k] = (ret[0][k] ? 1==ret[0][k].readUInt8(0) : null);
              }
            }

            if (err)
              cb(err, null);
            else
              cb(null, (ret ? ret[0] : null));
          });
        });
      } else {   
        conn.query(sql, function(err, ret){
          // fix boolean col.
          if (ret && ret[0])
          {
            for (let j = 0; j < ctx._boolCols.length; j++) {
              let k = ctx._boolCols[j];
              ret[0][k] = (ret[0][k] ? 1==ret[0][k].readUInt8(0) : null);
            }
          }

          if (err)
            cb(err, null);
          else
            cb(null, (ret ? ret[0] : null));
        });
      } // if...else.

      
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }


  /**
  * @desc: query by id and lock row for update (use in transaction).
  *         the last param can be conn.
  * @param: id, [query_cols]
  *           query_cols: [col1,col2], the cols will be query.
  * @return: mod.
  */
  *queryLockRow( id ) {
    assert(id != null && id != undefined);
    if (isNaN(id))
      throw new exception('id is not a number', exception.DB_ERROR_SQL, __filename, __line);

    let conn = this.get_conn_db(arguments);
    assert(conn);

    let query_cols;
    if (arguments[1] && (arguments[1] instanceof Array))
      query_cols = arguments[1];
    let query_str = this._makeCols3(query_cols);

    let sql = "SELECT " + query_str + " FROM `" + this.tablename + "` WHERE `" + this.idKeyName + "`=" + id + " FOR UPDATE";

    try {
      var ret = yield citong.utils.denodeify(conn.query, conn)(sql);
      // fix boolean col.
      if (ret && ret[0])
      {
        for (let j = 0; j < this._boolCols.length; j++) {
          let k = this._boolCols[j];
          ret[0][k] = (ret[0][k] ? 1==ret[0][k].readUInt8(0) : null);
        }
      }
      return ret ? ret[0] : null;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return null;
    }
  }

  /**
  * @desc: query by id and lock row for update (use in transaction).
  *         the last param can be conn.
  * @param: id, [query_cols], cb
  *           - query_cols: [col1,col2], the cols will be query.
  *           - cb: function(err, ret:mod)  {}
  * @return: mod.
  */
  queryLockRowSync( id ) {
    assert(id != null && id != undefined);
    if (isNaN(id))
      throw new exception('id is not a number', exception.DB_ERROR_SQL, __filename, __line);

    let conn = this.get_conn_db(arguments);
    assert(conn);

    let query_cols;
    var cb;
    if (arguments[1] && (arguments[1] instanceof Array))
    {
      query_cols = arguments[1];
      cb = arguments[2];
    }
    else
    {
      cb = arguments[1];
    }
    assert(typeof cb === 'function');

    let query_str = this._makeCols3(query_cols);

    let sql = "SELECT " + query_str + " FROM `" + this.tablename + "` WHERE `" + this.idKeyName + "`=" + id + " FOR UPDATE";

    var ctx = this;
    try {      
      conn.query(sql, function(err, ret){
        if (err)  cb(err, null);
        else
        {
          if (ret && ret[0])
          {
            for (let j = 0; j < ctx._boolCols.length; j++) {
              let k = ctx._boolCols[j];
              ret[0][k] = (ret[0][k] ? 1==ret[0][k].readUInt8(0) : null);
            }
            ret = ret[0];
          }
          cb(null, ret);
        }
      });
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }


  /**
  * @desc: query top.
  *         the last param can be conn.
  * @param: where, {orderby}, [query_cols]
  *           - orderby: {key:true/false} true-means asc, false-means desc.
  *           - query_cols: [col1,col2], the cols will be query.
  * @return: mod.
  */
  *queryTop( where ) {
    let conn = this.get_conn_db(arguments);

    let query_cols;
    let query_order;

    if (typeof arguments[0] !== 'string')
    {
      where = null;
      if ((typeof arguments[0] === 'object') && !(arguments[0] instanceof Array))
      {
        query_order = arguments[0];
        if (arguments[1] && (arguments[1] instanceof Array))
        {
          query_cols = arguments[1];
        }
      }
      else if (arguments[0] instanceof Array)
      {
        query_cols = arguments[0];
      }
    }
    else {
      if ((typeof arguments[1] === 'object') && !(arguments[1] instanceof Array))
      {
        query_order = arguments[1];
        if (arguments[2] && (arguments[2] instanceof Array))
        {
          query_cols = arguments[2];
        }
      }
      else if (arguments[1] instanceof Array)
      {
        query_cols = arguments[1];
      }
    }

    let ret;
    if (query_order && query_cols)
      ret = yield this.queryWhere(where, [0, 1], query_order, query_cols, conn);
    else if (query_order)
      ret = yield this.queryWhere(where, [0, 1], query_order, conn);
    else if (query_cols)
      ret = yield this.queryWhere(where, [0, 1], query_cols, conn);
    else
      ret = yield this.queryWhere(where, [0, 1], conn);

    return ret ? ret[0] : null;
  }
  /**
  * @desc: query top.
  *         the last param can be conn.
  * @param: where, {orderby}, [query_cols], cb
  *           - orderby: {key:true/false} true-means asc, false-means desc.
  *           - query_cols: [col1,col2], the cols will be query.
  *           - cb: function(err, ret:mod)  {}
  */
  queryTopSync( where ) {
    let conn = this.get_conn_db(arguments);

    let query_cols;
    let query_order;
    let cb;

    if (typeof arguments[0] !== 'string')
    {
      where = null;
      if ((typeof arguments[0] === 'object') && !(arguments[0] instanceof Array))
      {
        query_order = arguments[0];
        if (arguments[1] && (arguments[1] instanceof Array))
        {
          query_cols = arguments[1];
          cb = arguments[2];
        }
        else {
          cb = arguments[1];
        }
      }
      else if (arguments[0] instanceof Array)
      {
        query_cols = arguments[0];
        cb = arguments[1];
      }
      else {
        cb = arguments[0];
      }
    }
    else {
      if ((typeof arguments[1] === 'object') && !(arguments[1] instanceof Array))
      {
        query_order = arguments[1];
        if (arguments[2] && (arguments[2] instanceof Array))
        {
          query_cols = arguments[2];
          cb = arguments[3];
        }
        else {
          cb = arguments[2];
        }
      }
      else if (arguments[1] instanceof Array)
      {
        query_cols = arguments[1];
        cb = arguments[2];
      }
      else {
        cb = arguments[1];
      }
    }

    var cbf = function(err, ret) {
      if (err)  cb(err, null);
      else {
        cb(null, (ret?ret[0]:null));
      }
    }

    if (query_order && query_cols)
      this.queryWhereSync(where, [0, 1], query_order, query_cols, cbf, conn);
    else if (query_order)
      this.queryWhereSync(where, [0, 1], query_order, cbf, conn);
    else if (query_cols)
      this.queryWhereSync(where, [0, 1], query_cols, cbf, conn);
    else
      this.queryWhereSync(where, [0, 1], cbf, conn);
  }

  /**
  * @desc: query
  *         the last param can be conn.
  * @param: where, [offset,limit], {orderby}, [query_cols]
  *           orderby: {key:true/false} true-means asc, false-means desc.
  *           query_cols: [col1,col2], the cols will be query.
  * @return: mod[].
  */
  *queryWhere( where ) {
    var arg_len = arguments.length;
    let needRelease = false;
    let conn = this.client;
    if (arguments.length > 0 && (arguments[arguments.length-1] instanceof database_connection) && arguments[arguments.length-1].conn)
    {
      conn = arguments[arguments.length-1].conn;
      arg_len--;
    }
    else
    {
      try {
        conn = yield citong.utils.denodeify(this.client.getConnection, this.client)(); needRelease = true;
        if (!conn)  return null;
      } catch (e) { return null; }
    }

    let index;
    let offset = 0;
    let limit = 100;
    let order;
    let query_cols = '*';

    index = 0;
    if (++index < arg_len)
    {
      if (arguments[index] instanceof Array)
      {
        if (arguments[index].length == 2 && !isNaN(arguments[index][0]) && !isNaN(arguments[index][1]))
        {
          offset = arguments[index][0];
          limit = arguments[index][1];

          if (++index < arg_len && (typeof arguments[index] === 'object') && !(arguments[index] instanceof Array))
          {
              order = arguments[index];
              if (++index < arg_len && (arguments[index] instanceof Array))
              {
                query_cols = arguments[index];
                query_cols = this._makeCols3(query_cols);
              }
          }
        }
        else {
          query_cols = arguments[index];
          query_cols = this._makeCols3(query_cols);
        }
      }
      else if (typeof arguments[index] === 'object')
      {
        order = arguments[index];
        if (++index < arg_len && (arguments[index] instanceof Array))
        {
          query_cols = arguments[index];
          query_cols = this._makeCols3(query_cols);
        }
      }
    }

    let sql = "SELECT " + query_cols + " FROM `" + this.tablename + "`";
    if (where != null && where != undefined && where.length > 0)
      sql += " WHERE " + (where);

    if (order)
    {
      let first = true;
      let sql2 = '';
      for (let k in order) {
        let v = this.model[k];
        if (!v)
            continue;

        if (first)
          first = false;
        else
          sql2 += ',';

        sql2 += '`' + k + '` ';
        if (!order[k])
          sql2 += 'DESC';
      }

      if (sql2.length > 0)
        sql += " ORDER BY " + sql2;
    }

    sql += " LIMIT " + offset + "," + limit;

    try {
      var ret = yield citong.utils.denodeify(conn.query, conn)(sql);
      // fix boolean col.
      if (ret && ret.length > 0)
      {
        for (let j = 0; j < this._boolCols.length; j++) {
          let k = this._boolCols[j];
          if (ret[0][k] == undefined)
            continue;

          for (let i = 0; i < ret.length; i++) {
            ret[i][k] = (ret[i][k] ? 1==ret[i][k].readUInt8(0) : null);
          }
        }
      }
      return ret;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return null;
    } finally {
      if (needRelease)  conn.release();
    }
  }

  /**
  * @desc: query
  *         the last param can be conn.
  * @param: where, [offset,limit], {orderby}, [query_cols]
  *           -orderby: {key:true/false} true-means asc, false-means desc.
  *           -query_cols: [col1,col2], the cols will be query.
  *           -cb:  function(err, ret:mod[])  {}
  */
  queryWhereSync( where ) {
    var arg_len = arguments.length;
    let conn = this.client;
    if (arguments.length > 0 && (arguments[arguments.length-1] instanceof database_connection) && arguments[arguments.length-1].conn)
    {
      conn = arguments[arguments.length-1].conn;
      arg_len--;
    }

    let index;
    let offset = 0;
    let limit = 100;
    let order;
    let query_cols = '*';
    var cb;

    index = 0;
    if (++index < arg_len)
    {
      if (arguments[index] instanceof Array)
      {
        if (arguments[index].length == 2 && !isNaN(arguments[index][0]) && !isNaN(arguments[index][1]))
        {
          offset = arguments[index][0];
          limit = arguments[index][1];

          if (++index < arg_len && (typeof arguments[index] === 'object') && !(arguments[index] instanceof Array))
          {
              order = arguments[index];
              if (++index < arg_len && (arguments[index] instanceof Array))
              {
                query_cols = arguments[index];
                query_cols = this._makeCols3(query_cols);
                cb = arguments[index+1];
              }
              else {
                cb = arguments[index];
              }
          }
          else {
            cb = arguments[index];
          }
        }
        else {
          query_cols = arguments[index];
          query_cols = this._makeCols3(query_cols);
          cb = arguments[index+1];
        }
      }
      else if (typeof arguments[index] === 'object')
      {
        order = arguments[index];
        if (++index < arg_len && (arguments[index] instanceof Array))
        {
          query_cols = arguments[index];
          query_cols = this._makeCols3(query_cols);
          cb = arguments[index+1];
        }
        else {
          cb = arguments[index];
        }
      }
      else {
        cb = arguments[index];
      }
    }

    assert(typeof cb === 'function');

    let sql = "SELECT " + query_cols + " FROM `" + this.tablename + "`";
    if (where != null && where != undefined && where.length > 0)
      sql += " WHERE " + (where);

    if (order)
    {
      let first = true;
      let sql2 = '';
      for (let k in order) {
        let v = this.model[k];
        if (!v)
            continue;

        if (first)
          first = false;
        else
          sql2 += ',';

        sql2 += '`' + k + '` ';
        if (!order[k])
          sql2 += 'DESC';
      }

      if (sql2.length > 0)
        sql += " ORDER BY " + sql2;
    }

    sql += " LIMIT " + offset + "," + limit;

    try {
      var ctx = this;

      if (!conn) {
        this.client.getConnection(function(err, connection){
          connection.query(sql, function(err, ret){
            connection.release();
            if (err)  cb(err, null);
            else
            {
              // fix boolean col.
              if (ret && ret.length > 0)
              {
                for (let j = 0; j < ctx._boolCols.length; j++) {
                  let k = ctx._boolCols[j];
                  if (ret[0][k] == undefined)
                    continue;

                  for (let i = 0; i < ret.length; i++) {
                    ret[i][k] = (ret[i][k] ? 1==ret[i][k].readUInt8(0) : null);
                  }
                }
              }

              cb(null, ret);
            }
          });
        });
      } else {   
        conn.query(sql, function(err, ret){
          if (err)  cb(err, null);
          else
          {
            // fix boolean col.
            if (ret && ret.length > 0)
            {
              for (let j = 0; j < ctx._boolCols.length; j++) {
                let k = ctx._boolCols[j];
                if (ret[0][k] == undefined)
                  continue;

                for (let i = 0; i < ret.length; i++) {
                  ret[i][k] = (ret[i][k] ? 1==ret[i][k].readUInt8(0) : null);
                }
              }
            }

            cb(null, ret);
          }
        });
      } // if...else.

    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }

  /**
  * @desc: count
  *         the last param can be conn.
  * @param: where
  * @return: int.
  */
  *count() {
    let conn = this.get_conn_db(arguments);
    let needRelease = false;

    let where = arguments[0];
    let sql = "SELECT COUNT(*) FROM `" + this.tablename + "`";
    if (where != null && where != undefined && (typeof where === "string"))
      sql += " WHERE " + (where);

    try {
      if (!conn)  { conn = yield citong.utils.denodeify(this.client.getConnection, this.client)(); needRelease = true; }
      if (!conn)  return -1;
    } catch (e) { return -1; }

    try {
      var ret = yield citong.utils.denodeify(conn.query, conn)(sql);
      return (ret && ret.length >= 1) ? ret[0]['COUNT(*)'] : -1;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return -1;
    } finally {
      if (needRelease)  conn.release();
    }
  }

  /**
  * @desc: count
  *         the last param can be conn.
  * @param: where, cb
  *           - cb: function(err, ret:int)  {}
  */
  countSync() {
    let conn = this.get_conn_db(arguments);

    let where = arguments[0];
    var cb;
    if (typeof where !== 'string')
    {
      cb = arguments[0];
      where = null;
    }
    else {
      cb = arguments[1];
    }
    assert(typeof cb === 'function');

    let sql = "SELECT COUNT(*) FROM `" + this.tablename + "`";
    if (where != null && where != undefined && (typeof where === "string"))
      sql += " WHERE " + (where);

    try {
      if (!conn) {
        this.client.getConnection(function(err, connection){
          connection.query(sql, function(err, ret){
            connection.release();
            if (err)  cb(err, null);
            else
            {
              cb(null, ((ret && ret.length >= 1) ? ret[0]['COUNT(*)'] : -1));
            }
          });
        });
      } else {   
        conn.query(sql, function(err, ret){
          if (err)  cb(err, null);
          else
          {
            cb(null, ((ret && ret.length >= 1) ? ret[0]['COUNT(*)'] : -1));
          }
        });
      } // if...else.

    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }

  /**
  * @desc: isExitWhere
  *         the last param can be conn.
  * @return: boolean.
  */
  *isExistWhere( where ) {
    let conn = this.get_conn_db(arguments);
    let needRelease = false;

    let sql = "SELECT COUNT(*) FROM `" + this.tablename + "`";
    if (where != null && where != undefined)
      sql += " WHERE " + (where);
    sql += " LIMIT 0,1";

    try {
      if (!conn)  { conn = yield citong.utils.denodeify(this.client.getConnection, this.client)(); needRelease = true; }
      if (!conn)  return false;
    } catch (e) { return false; }

    try {
      var ret = yield citong.utils.denodeify(conn.query, conn)(sql);
      return (ret && ret.length >= 1) ? ret[0]['COUNT(*)'] >= 1 : false;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return false;
    } finally {
      if (needRelease)  conn.release();
    }
  }

  /**
  * @desc: isExitWhere
  *         the last param can be conn.
  * @param where, cb
  *         - cb: function(err, r:boolrean)  {}
  */
  isExistWhereSync() {
    let conn = this.get_conn_db(arguments);

    let where = arguments[0];
    var cb;
    if (typeof where !== 'string')
    {
      cb = arguments[0];
      where = null;
    }
    else {
      cb = arguments[1];
    }
    assert(typeof cb === 'function');

    let sql = "SELECT COUNT(*) FROM `" + this.tablename + "`";
    if (where != null && where != undefined)
      sql += " WHERE " + (where);
    sql += " LIMIT 0,1";

    try {
      if (!conn) {
        this.client.getConnection(function(err, connection){
          connection.query(sql, function(err, ret){
            connection.release();
            if (err)  cb(err, null);
            else
            {
              cb(null, ((ret && ret.length >= 1) ? ret[0]['COUNT(*)'] >= 1 : false));
            }
          });
        });
      } else {   
        conn.query(sql, function(err, ret){
          if (err)  cb(err, null);
          else
          {
            cb(null, ((ret && ret.length >= 1) ? ret[0]['COUNT(*)'] >= 1 : false));
          }
        });
      } // if...else.

      
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }

  /**
  * @desc: isExist
  *         the last param can be conn.
  * @return: boolean.
  */
  *isExist( id ) {
    if (isNaN(id))
      throw new exception('id is not a number', exception.DB_ERROR_SQL, __filename, __line);

    let conn = this.get_conn_db(arguments);
    let needRelease = false;

    let sql = "SELECT COUNT(*) FROM `" + this.tablename + "` WHERE `" + this.idKeyName + "`=" + id + " LIMIT 0,1";

    try {
      if (!conn)  { conn = yield citong.utils.denodeify(this.client.getConnection, this.client)(); needRelease = true; }
      if (!conn)  return false;
    } catch (e) { return false; }

    try {
      var ret = yield citong.utils.denodeify(conn.query, conn)(sql);
      return (ret && ret.length >= 1) ? ret[0]['COUNT(*)'] >= 1 : false;
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
      return false;
    } finally {
      if (needRelease)  conn.release();
    }
  }

  /**
  * @desc: isExist
  *         the last param can be conn.
  * @param id, cb
  *         - cb: function(err, r:boolean)  {}
  */
  isExistSync( id, cb ) {
    if (isNaN(id))
      throw new exception('id is not a number', exception.DB_ERROR_SQL, __filename, __line);

    let conn = this.get_conn_db(arguments);

    let sql = "SELECT COUNT(*) FROM `" + this.tablename + "` WHERE `" + this.idKeyName + "`=" + id + " LIMIT 0,1";
    try {
      if (!conn) {
        this.client.getConnection(function(err, connection){
          connection.query(sql, function(err, ret){
            connection.release();
            if (err)  cb(err, null);
            else
            {
              cb(null, ((ret && ret.length >= 1) ? ret[0]['COUNT(*)'] >= 1 : false));
            }
          });
        });
      } else {   
        conn.query(sql, function(err, ret){
          if (err)  cb(err, null);
          else
          {
            cb(null, ((ret && ret.length >= 1) ? ret[0]['COUNT(*)'] >= 1 : false));
          }
        });
      } // if...else.

      
    } catch (e) {
      this._handleErr(sql, e, __filename, __line);
    }
  }


  /**
  * @desc is biginteger or integer.
  */
  _isBiginteger( v ) {

    if (Number.isInteger(v))
      return true;
    if (!v)
      return false;

    if (typeof v === 'string')
    {
      for (var i = 1; i < v.length; i++) {
        if (v[i] < '0' || v[i] > '9')
          return false;
      }

      if (v.length == 0)  return false;
      else if (v.length == 1)
      {
        if (v[i] < '0' || v[i] > '9') return false;
        else return true;
      }
      else {
        if (v[0] == '0')  return false;
        else
          return (v[0] == '-' || (v[0] >= '0' && v[0] <= '9'));
      }
    }

    return false;
  }

  /**
  * @desc: make (no contain id col. and check col size)
  *         the string1. `col1`,`col2`,...,`coln`
  *         the string2. v1,v2,...,vn
  * @return: [string1, string2].
  */
  _makeCols1( item ) {
    let sql1 = '';
    let sql2 = '';

    let first = true;
    for (var k in item) {
      // if (k == this.idKeyName)
      //   continue;
      let vv = item[k];
      if (vv == null || vv == undefined)
        continue;

      var v = this.model[k];
      if (v != undefined) {
        if (first) {
          first = false;
        } else {
          sql1 += ',';
          sql2 += ',';
        }
        sql1 += '`' + k + '`';
        if (vv instanceof origin_sql)
        {
          sql2 += vv.v;
        }
        else if (v.type == 'text')
        {
          if (v.size && v.size < vv.length)
            throw new exception(k + ' is too long: ' + vv.length, exception.DB_ERROR_SQL, __filename, __line);

          sql2 += this.escape(vv);
        }
        else if (v.type == 'boolean')
        {
          sql2 += (vv ? '1' : '0');
        }
        else if (v.type == 'integer')
        {
          if (v.size && v.size > 4)
          {
            if (!this._isBiginteger(vv))
            {
              throw new exception(k + ' is not a biginteger: type-' + (typeof vv) + ' value-' + vv, exception.DB_ERROR_SQL, __filename, __line);
            }
          }
          else
          {
            if (!Number.isInteger(vv))
              throw new exception(k + ' is not a integer: type-' + (typeof vv) + ' value-' + vv, exception.DB_ERROR_SQL, __filename, __line);
          }
          sql2 += vv;
        }
        else // float.
        {
          if (isNaN(vv))
            throw new exception(k + ' is not a number: type-' + (typeof vv) + ' value-' + vv, exception.DB_ERROR_SQL, __filename, __line);
          sql2 += vv;
        }
      }
    } // for.

    return [sql1, sql2];
  }

  /**
  * @desc: make (no contain id col.)
  *         the string. `col1`=v1,`col2`=v2,...,`coln`=vn
  * @return: string.
  */
  _makeCols2( item ) {
    let sql1 = '';

    let first = true;
    for (var k in item) {
      if (k == this.idKeyName)
        continue;
      let vv = item[k];
      if (vv == null || vv == undefined)
        continue;

      var v = this.model[k];
      if (v != undefined) {
        if (first) {
          first = false;
        } else {
          sql1 += ',';
        }
        sql1 += '`' + k + '`=';
        if (vv instanceof origin_sql)
        {
          sql1 += vv.v;
        }
        else if (v.type == 'text')
        {
          if (v.size && v.size < vv.length)
            throw new exception(k + ' too long:' + vv.length, exception.DB_ERROR_SQL, __filename, __line);

          sql1 += this.escape(vv);
        }
        else if (v.type == 'boolean')
        {
          sql1 += (vv ? '1' : '0');
        }
        else if (v.type == 'integer')
        {
          if (vv instanceof update_inc)
          {
            sql1 += '`' + k + '`+' + vv.n;
          }
          else {
            if (v.size && v.size > 4)
            {
              if (!this._isBiginteger(vv))
                throw new exception(k + ' is not a biginteger: type-' + (typeof vv) + ' value-' + vv, exception.DB_ERROR_SQL, __filename, __line);
            }
            else
            {
              if (!Number.isInteger(vv))
                throw new exception(k + ' is not a integer: type-' + (typeof vv) + ' value-' + vv, exception.DB_ERROR_SQL, __filename, __line);
            }
            sql1 += vv;
          }
        }
        else
        {
          if (isNaN(vv))
            throw new exception(k + ' is not a number: type-' + (typeof vv) + ' value-' + vv, exception.DB_ERROR_SQL, __filename, __line);
          sql1 += vv;
        }
      }
    } // for.

    return sql1;
  }

  /**
  * @desc: make
  *         the string1. `col1`,`col2`,...,`coln`
  *       or '*'
  * @return: string1.
  */
  _makeCols3( item ) {
    if (!item)
      return '*';
    let sql1 = '';

    let first = true;
    for (var k = 0; k < item.length; k++) {
      let vv = item[k];
      if (vv == null || vv == undefined)
        continue;

      if (first) {
        first = false;
      } else {
        sql1 += ',';
      }

      var v = this.model[vv];
      if (v != undefined) {
        sql1 += '`' + vv + '`';
      }
      else {
        sql1 += vv;
      }
    } // for.

    return sql1.length > 0 ? sql1 : '*';
  }

  /**
  * @desc: 构造指定 key 的 value
  * @return: value
  */
  _escape_v( key, value ) {
    var v = this.model[key];
    if (!v)
      throw new exception(key + ' is not existed', exception.DB_ERROR_SQL, __filename, __line);

    if (v.type == 'text')
    {
      if (v.size && v.size < value.length)
        throw new exception(k + ' is too long: ' + value.length, exception.DB_ERROR_SQL, __filename, __line);

      return this.escape(value);
    }
    else if (v.type == 'boolean')
    {
      return (value ? '1' : '0');
    }
    else if (v.type == 'integer')
    {
      if (v.size && v.size > 4)
      {
        if (!this._isBiginteger(value))
          throw new exception(key + ' is not a biginteger: type-' + (typeof value) + ' value-' + value, exception.DB_ERROR_SQL, __filename, __line);
      }
      else
      {
        if (!Number.isInteger(value))
          throw new exception(key + ' is not a integer: type-' + (typeof value) + ' value-' + value, exception.DB_ERROR_SQL, __filename, __line);
      }
      return value;
    }
    else
    {
      if (isNaN(value))
        throw new exception(key + ' is not a number: type-' + (typeof value) + ' value-' + value, exception.DB_ERROR_SQL, __filename, __line);
      return value;
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
      throw new exception(sql, exception.DB_ERROR_CONNECT, filename, line);
    }
    else
    {
      throw new exception(sql, exception.DB_ERROR, filename, line);
    }
  }
};
