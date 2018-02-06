'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

var debug      = require('debug')('febs-db');
var mysql      = require('mysql');
var febs       = require('febs');
var assert     = require('assert');
var BigNumber  = require('bignumber.js');
var exception  = require('../exception');
var dataType   = require('../dataType');
var table_helper = require('./table_helper');
var type_cast    = require('./type_cast');
var handle_err   = require('./handle_err');
var isolationLevel = require('../isolationLevel');
var procedureParams = require('../procedureParams');
var PromiseLib   = Promise;

module.exports = {
  escape_like,
  createPool,
  errHandle:  ()=>{},
  exec,
  execProcedure,
  transaction,
  type_cast,
  table_helper,
  opt_cvt,
  ret_data_cvt,

  add,
  remove,
  update,
  selectLockRow,
  select,
  count,
  exist,

  sql_add,
  sql_count,
  sql_remove,
  sql_select,
  sql_selectLockRow,
  sql_update,
}

/**
* @desc: 转换查询结果.
* @return: 
*/
function ret_cvt(ret) {
  let cret = {};
  if (!ret) {
    cret.rows = [];
    cret.rowsAffected = 0;
    return cret;
  }

  if (ret.hasOwnProperty('affectedRows')) {
    cret.rowsAffected = ret.affectedRows;
  }
  if (ret.hasOwnProperty('insertId')) {
    cret.insertId = ret.insertId;
    cret.insertId = dataType.getValueBigInt(cret.insertId);
  }
  if (ret instanceof Array) {
    cret.rowsAffected = ret.length;
    cret.rows = ret;
  }

  if (!cret.rows)
    cret.rows = [];
    
  return cret;
}

/**
* @desc: 转换查询结果中的数据,按类型转换.
* @param alreadyCvt: 用于防止重复转换.
* @return: 
*/
function ret_data_cvt(rows, table, alreadyCvt = null) {
  for (let i = 0; i < rows.length; i++) {
    if (alreadyCvt) {
      if (!alreadyCvt[i]) alreadyCvt[i] = {};
    }

    for (let k in rows[i]) {
      let rname = table.getLogicColName(k);
      if (!rname) continue;

      let kk = table.model[rname];
      if (kk) {

        // 转换过不再处理.
        if (alreadyCvt) {
          if (alreadyCvt[i][kk.map])
            continue;
          
          alreadyCvt[i][kk.map] = true;
        }

        let t = dataType.getType(kk.type);
        // fix bigint col.
        if (typeof rows[i][kk.map] === 'string' && t === dataType.BigInt) {
          rows[i][kk.map] = dataType.getValueBigInt(rows[i][kk.map]);
        }
        // fix boolean col.
        else if (t === dataType.Bit) {
          rows[i][kk.map] = dataType.getValueBit(rows[i][kk.map]);
        }
        // fix datetime.
        else if (t == dataType.DateTime) {
          if (rows[i][kk.map] instanceof Date) {
            if (rows[i][kk.map] == 'Invalid Date')
              rows[i][kk.map] = null;
            else {
              let localDate = Date.UTC(
                rows[i][kk.map].getFullYear(),
                rows[i][kk.map].getMonth(), 
                rows[i][kk.map].getDate(), 
                rows[i][kk.map].getHours(), 
                rows[i][kk.map].getMinutes(), 
                rows[i][kk.map].getSeconds());
              rows[i][kk.map] = new Date(localDate);
            }
          } else { // string.
            let ttt = new Date(rows[i][kk.map]);
            if (ttt == 'Invalid Date')
              rows[i][kk.map] = null;
            else  
              rows[i][kk.map] = new Date(Date.UTC(ttt.getFullYear(), ttt.getMonth(), ttt.getDate(), ttt.getHours(), ttt.getMinutes(), ttt.getSeconds()));
          }
        }
      }

      if (rname != kk.map) {
        rows[i][rname] = rows[i][kk.map];
        delete rows[i][kk.map];
      }
    }
  }
  return rows;
}

/**
* @desc: convert opt to mysql opt.
* @return: 
*/
function opt_cvt(opt) {
  opt.waitForConnections = opt.hasOwnProperty('waitForConnections') ? opt.waitForConnections : true;
  opt.supportBigNumbers  = opt.hasOwnProperty('supportBigNumbers') ? opt.supportBigNumbers : true;
  opt.bigNumberStrings   = opt.hasOwnProperty('bigNumberStrings') ? opt.bigNumberStrings : false;
  
  opt.connectTimeout     = opt.hasOwnProperty('connectTimeout') ? opt.connectTimeout : 5000;
  opt.queryTimeout       = opt.hasOwnProperty('queryTimeout') ? opt.queryTimeout : 5000;
  opt.acquireTimeout     = opt.hasOwnProperty('acquireTimeout') ? opt.acquireTimeout : 5000;
  opt.queueLimit         = opt.hasOwnProperty('queueLimit') ? opt.queueLimit : 200;
  opt.connectionLimit    = opt.hasOwnProperty('connectionLimit') ? opt.connectionLimit : 10;
  opt.host               = opt.host;
  opt.port               = opt.hasOwnProperty('port') ? opt.port : 3306;
  opt.database           = opt.database;
  opt.user               = opt.user;
  opt.password           = opt.password;

  return opt;
}

function escape_like(str) {
  str = febs.string.replace(str, "\\", "\\\\");
  str = febs.string.replace(str, "'", "\\'");
  str = febs.string.replace(str, "[", "[[]");
  str = febs.string.replace(str, "%", "[%]");
  return febs.string.replace(str, "_", "[_]");
}

/**
* @desc: create connection pool.
* @return: 
*/
function createPool(opt) {
  return mysql.createPool(opt);
}

/**
* @desc: 执行sql语句. 
*     1. 如果传递了conn参数,则不创建新的连接,并且需要在使用结束后调用conn.release()将连接还给pool
*     2. 如果未传递conn参数,则创建新的连接,并且在使用后直接销毁.
* @return: (Promise) 正确返回结果.
*/
function exec(db, pool, sql, conn) {
  assert(!febs.string.isEmpty(sql));

  return new PromiseLib((resolve, reject)=>{
    let needRelease = false;
    try {
      // use new conn.
      if (!conn) {
        needRelease = true;
        pool.getConnection((err, conn1)=>{
          if (err) {
            reject(handle_err(sql, err, __filename, __line));
            return;
          }
          conn = conn1;

          conn.query({sql:sql, /*values:values,*/ timeout:db.queryTimeout}, (err, ret)=>{
            try {
              if (db.sqlLogCallback) db.sqlLogCallback(err, sql);
            } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }
            
            if (err) { conn.destroy(); reject(handle_err(sql, err, __filename, __line)); return; }
            conn.release();

            resolve(ret_cvt(ret));
          });
        });
      } else {
        conn.query({sql:sql, /*values:values,*/ timeout:db.queryTimeout}, (err, ret)=>{
          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, sql);
          } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }

          if (err) { reject(handle_err(sql, err, __filename, __line)); return; }
          resolve(ret_cvt(ret));
        });
      }
    } catch (e) {
      if (needRelease && conn)  conn.destroy();
      reject(handle_err(sql, e, __filename, __line));
    }
  });
}


/**
* @desc: 
* @return: (Promise) 正确返回结果.
*/
function execProcedure(db, pool, name, params, conn) {
  assert(!febs.string.isEmpty(name));

  return new PromiseLib((resolve, reject)=>{

    if (!(params instanceof procedureParams)) {
      reject(handle_err('', new exception(febs.exception.PARAM, febs.exception.PARAM, __filename, __line))); return;
    }

    let needRelease = false;
    let sql;
    try {
      // 构造参数语句.
      let paramSql = '';
      for (let i = 0; i < params.params.length; i++) {
        if (paramSql.length > 0)
          paramSql += ',';
        let pi = params.params[i];
        if (pi.in) {
          paramSql += type_cast(pi.value, pi.type, pi.name);
        } else {
          paramSql += '@a' + i;
        }
      } // if.

      sql = `CALL ${name}(${paramSql})`;

      // use new conn.
      if (!conn) {
        needRelease = true;
        pool.getConnection((err, conn1)=>{
          if (err) {
            reject(handle_err(sql, err, __filename, __line));
            return;
          }
          conn = conn1;

          conn.query({sql:sql, timeout:db.queryTimeout}, (err, ret)=>{
            try {
              if (db.sqlLogCallback) db.sqlLogCallback(err, sql);
            } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }
            
            if (err) { conn.destroy(); reject(handle_err(sql, err, __filename, __line)); return; }
            conn.release();

            let cret;
            try {
              cret = ret_cvt(ret[1]);
              ret = ret[0];
              if (ret) {
                cret.out = ret[0];
              }
            } catch (e) { reject(handle_err('get procedure result', e, __filename, __line)); return; }
            resolve(cret);
          });
        });
      } else {
        conn.query({sql:sql, timeout:db.queryTimeout}, (err, ret)=>{
          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, sql);
          } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }
        
          if (err) { reject(handle_err(sql, err, __filename, __line)); return; }

          let cret;
          try {
            cret = ret_cvt(ret[1]);
            ret = ret[0];
            if (ret) {
              cret.out = ret[0];
            }
          } catch (e) { reject(handle_err('get procedure result', e, __filename, __line)); return; }
          resolve(cret);
        });
      }
    } catch (e) {
      if (needRelease && conn)  conn.destroy();
      reject(handle_err(sql, e, __filename, __line));
    }
  });
}



/**
* @desc: transaction.
* @param fooCB: async function(database):boolean {}, 返回false则rollback, 返回true则commit.
* @return: (Promise).
*/
async function transaction_foo(db, fooCB, resolve, reject, conn, needCommit) {  
  try {
    let r = await fooCB(db);

    if (r === true) {
      if (needCommit) {
        conn.query('COMMIT', (err, ret)=>{
          debug('[COMMIT] ' + (err?"err":"ok"));
          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, 'COMMIT');
          } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }

          if (err) {
            conn.destroy();
            db._destroy();
            reject(handle_err('COMMIT', err, __filename, __line));
          } else {
            conn.destroy();
            db._destroy();
            resolve(true);
          }
        });
      }
      else {
        resolve(true);
      }
    }
    else {
      if (needCommit) {
        conn.query('ROLLBACK', (err, ret)=>{
          debug('[ROLLBACK] ' + (err?"err":"ok"));
          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, 'ROLLBACK');
          } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }

          if (err) {
            conn.destroy();
            db._destroy();
            reject(handle_err('ROLLBACK', err, __filename, __line));
          } else {
            conn.destroy();
            db._destroy();
            resolve(false);
          }
        });
      } else {
        resolve(false);
      }
    } // if..else.
  }
  catch (e) {
    if (needCommit) {
      conn.query('ROLLBACK', (err, ret)=>{
        debug('[ROLLBACK] ' + (err?"err":"ok"));
        try {
          if (db.sqlLogCallback) db.sqlLogCallback(err, 'ROLLBACK');
        } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }

        if (err) {
          conn.destroy();
          db._destroy();
          reject(handle_err('ROLLBACK', e, __filename, __line));
        } else {
          conn.destroy();
          db._destroy();
          reject(handle_err('ROLLBACK', e, __filename, __line));
        }
      });
    } else {
      reject(handle_err('ROLLBACK', e, __filename, __line));
    }
  }
}
function transaction(db, isolationLevel1, fooCB) {
  assert(db);

  return new PromiseLib((resolve, reject)=>{
    if (!fooCB || (typeof fooCB !== 'function')) {
      reject(new exception(febs.exception.PARAM, febs.exception.PARAM, __filename, __line));
      return;
    }

    if (db._transactionConn) {
      assert(!db.pool);
      debug('[Recursion Transaction]');
      transaction_foo(db, fooCB, resolve, reject, db._transactionConn, false);
    }
    else {

      if (isolationLevel1 != isolationLevel.Read_committed
      && isolationLevel1 != isolationLevel.Read_uncommitted
      && isolationLevel1 != isolationLevel.Repeatable_read
      && isolationLevel1 != isolationLevel.Serializable) {
        reject(new exception(febs.exception.PARAM, febs.exception.PARAM, __filename, __line));
        return;
      }
      
      assert(db.pool);
      db.pool.getConnection((err, conn)=>{
        if (err) {
          reject(handle_err('getConnection', err, __filename, __line));
          return;
        }

        let sqlLevel;
        if (isolationLevel1 == isolationLevel.Read_committed) {
          sqlLevel = 'SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED';
        } else if (isolationLevel1 == isolationLevel.Read_uncommitted) {
          sqlLevel = 'SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED';
        } else if (isolationLevel1 == isolationLevel.Repeatable_read) {
          sqlLevel = 'SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ';
        } else {
          sqlLevel = 'SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE';
        }

        conn.query({sql:sqlLevel, timeout:db.queryTimeout}, (err, ret)=>{
          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, sqlLevel);
          } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }

          if (err) { 
            conn.destroy();
            reject(handle_err(sqlLevel, err, __filename, __line));
            return;
          }

          conn.query({sql:'START TRANSACTION', timeout:db.queryTimeout}, (err, ret)=>{
            debug('[Begin Transaction] ' + (err?'err':'ok') + ' ' + isolationLevel1);
            try {
              if (db.sqlLogCallback) db.sqlLogCallback(err, 'START TRANSACTION');
            } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }

            if (err) { 
              conn.destroy();
              reject(handle_err('START TRANSACTION', err, __filename, __line));
              return;
            }

            db = db._cloneWithConn(conn);
            transaction_foo(db, fooCB, resolve, reject, conn, true);
          });

        });
      });
    }
  });
}


/**
* @desc: add
* @return: Promise.
* @resolve:
*   ret - boolean.
*/
function add( table, item ) {
  return table.db.exec(sql_add(table, item))
  .then(ret=>{
    if (ret && ret.insertId && table.idKeyNameAutoInc) {
      item[table.idKeyNameAutoInc] = ret.insertId;
    }
    return ret.rowsAffected > 0 ? true : false;
  });
}

/**
* @desc: remove
* @return: Promise.
* @resolve:
*   ret - boolean.
*/
function remove( table, where ) {
  return table.db.exec(sql_remove(table, where))
  .then(ret=>{
    return true;
  });
}

/**
* @desc: update;  where id = item.id.
*         if item.id is existed, sql condition is: 'id=value' AND (where)
*         otherwise sql condition is: where 
* @param item, where.
* @return: Promise.
* @resolve:
*   ret - boolean.
*/
function update( table, item, where = null ) {
  return table.db.exec(sql_update(table, item, where))
  .then(ret=>{
    return true;
  });
}

/**
* @desc: query by id and lock row for update (use in transaction).
*         id is Object if table is combined primary. 
* @param id: 主鍵值.
* @param query_cols:
*           [col1, col2, ...]需要查询出的字段名称数组,
*           其中, 如果未指定表名, 则默认为第一个表的元素.
* @return: Promise.
* @resolve:
*   ret - mod.
*/
function selectLockRow( table, id, query_cols = null, alias = null ) {
  if (!table.db._transactionConn) {
    throw new exception('selectLockRow only call in transaction', exception.DB_CommonException, __filename, __line);
  }
  
  return table.db.exec(sql_selectLockRow(table, id, query_cols, alias))
  .then(ret=>{
    if (ret.rows && ret.rows.length > 0)
      return ret_data_cvt(ret.rows, table)[0];
    return null;
  });
}


/**
* @desc: query
*         sql的连接顺序为: SELECT query_cols FROM  where groupSql orderby pageInfo.
* @param where:
*           查询条件,不会对此字符串验证. 使用 condition 对象进行构建.
* @param opt: 查询选项. 可以包含以下键值.
*         - cols:  需要查询出的字段名称数组; 例如: [col1, col2, ...]; 不指定则为查询全部.
*         - groupSql:   group by子句, 不会对内容进行验证; 应包含group by关键字.
*         - orderby:    orderby by子句, 例如: {key:true/false} true-means asc, false-means desc..
*         - offset:     分页查询起始位置.
*         - limit:      分页查询查询行数.
* @param alias: 
*           别名
* @return: Promise.
* @resolve:
*   ret - mod array.
*/
function select( table, where, opt = null, alias = null  ) {
  opt = opt || {};
  let query_cols = opt.cols;
  let groupSql   = opt.groupSql;
  let orderby    = opt.orderby;
  let pageinfo   = {offset:opt.offset, limit:opt.limit};
  return table.db.exec(sql_select(table, where, query_cols, groupSql, orderby, pageinfo, alias))
  .then(ret=>{
    if (ret.rows)
      return ret_data_cvt(ret.rows, table);
    return [];
  });
}

/**
* @desc: count
* @param: where
* @return: Promise.
* @resolve:
*   ret - number.
*/
function count(table, where = null, alias = null) {
  return table.db.exec(sql_count(table, where, alias))
  .then(ret=>{
    if (!ret.rows)
      return -1;
      
    return (ret.rows.length >= 1) ? ret.rows[0]['COUNT(*)'] : -1;
  });
}

/**
* @desc: exist
*         id is Object if table is combined primary. 
* @return: Promise.
* @resolve:
*   ret - boolean.
*/
function exist( table, id, alias = null ) {

  assert(id != null && id != undefined);

  if (table.idKeyIsCombined && !(id instanceof Object)) {
    throw new exception('params id is error in exist', febs.exception.PARAM, __filename, __line);
  }
  
  // combined key.
  let sqlprimary = '';

  if (table.idKeyIsCombined) {
    for (let i = 0; i < table.idKeyName.length; i++) {
      let id2 = id[table.idKeyName[i]];
      if (id2 === undefined || id2 === null) {
        sqlprimary = null;
        break;
      } else {
        if (i > 0)
          sqlprimary += ' AND ';
        sqlprimary += "`" + table.idKeyName[i] + "`=" + type_cast(id2, table.model[table.idKeyName[i]].type, table.idKeyName[i]);
      }
    }
  } else {
    let id2 = id;
    if (id2 !== undefined && id2 !== null) {
      sqlprimary += "`" + table.idKeyName + "`=" + type_cast(id2, table.model[table.idKeyName].type, table.idKeyName);
    } else {
      sqlprimary = null;
    }
  }

  if (!sqlprimary) {
    throw new exception('params id is error in isExist', exception.DB_ERROR_SQL, __filename, __line);
  }

  return table.db.exec(sql_count(table, sqlprimary, alias))
  .then(ret=>{
    if (!ret.rows)
      return false;

    return (ret.rows.length >= 1) ? ret.rows[0]['COUNT(*)'] >= 1 : false;
  });
}


/**
* @desc: add
* @return: sql string.
*/
function sql_add( table, item ) {
  assert(item != null && item != undefined);
  let sqlv = table_helper.makeColsKeysAndValues(item, table);
  let sql = "INSERT INTO `" + table.tablename + "` (" + sqlv[0] + ") VALUES(" + sqlv[1] + ")";
  return sql;
}

/**
* @desc: remove
* @return: sql string.
*/
function sql_remove( table, where ) {
  assert(where != null && where != undefined && where.length > 0);
  let sql = "DELETE FROM `" + table.tablename + "` WHERE " + (where);
  return sql;
}

/**
* @desc: update;  where id = item.id.
*         if item.id is existed, sql condition is: 'id=value' AND (where)
*         otherwise sql condition is: where 
* @param item, where.
* @return: sql string.
*/
function sql_update( table, item, where = null ) {
  assert(item != null && item != undefined);
  let sqlv = table_helper.makeColsKeyPairs(item, table);
  let sql = "UPDATE `" + table.tablename + "` SET " + sqlv + " WHERE ";

  // combined key.
  let sqlprimary = '';

  if (table.idKeyIsCombined) {
    for (let i = 0; i < table.idKeyName.length; i++) {
      let name = table.idKeyName[i];
      let id = item[name];
      if (id === undefined || id === null) {
        sqlprimary = null;
        break;
      } else {
        if (i > 0)
          sqlprimary += ' AND ';
        sqlprimary += "`" + table.idKeyName[i] + "`=" + type_cast(id, table.model[name].type, name);
      }
    }
  } else {
    let id = item[table.idKeyName];
    if (id !== undefined && id !== null) {
      sqlprimary += "`" + table.idKeyName + "`=" + type_cast(id, table.model[table.idKeyName].type, table.idKeyName);
    }
  }

  if (sqlprimary)
  {
    sql += sqlprimary;
    if (!febs.string.isEmpty(where))
    {
      sql += ' AND (' + where + ')';
    }
  }
  else {
    if (!febs.string.isEmpty(where))
    {
      sql += where;
    }
    else {
      throw new exception('no item.id and no where', exception.DB_SqlException, __filename, __line);
    }
  }

  return sql;
}

/**
* @desc: query by id and lock row for update (use in transaction).
*         id is Object if table is combined primary. 
* @param id: 主鍵值.
* @param query_cols:
*           [col1, col2, ...]需要查询出的字段名称数组,
*           其中, 如果未指定表名, 则默认为第一个表的元素.
* @return: sql string.
*/
function sql_selectLockRow( table, id, query_cols = null, alias = null ) {
  assert(id != null && id != undefined);

  let sqlprimary = table_helper.makePrimaryValues(id, table, alias);
  let query_str = table_helper.makeCols(query_cols, table, alias);

  let alis;
  if (alias) {
    if (alias.indexOf(' ') >= 0)  alis = '('+alias+')';
    else alis = table.tablename + ' AS '+alias;
  }
  else {
    alis = table.tablename;
  }
  
  let sql = "SELECT " + query_str + " FROM " + alis + " WHERE " + sqlprimary + " FOR UPDATE";
  return sql;
}


/**
* @desc: query
*         sql的连接顺序为: SELECT query_cols FROM  where groupSql orderby pageInfo.
*
* @param where:
*           查询条件,不会对此字符串验证.
* @param query_cols:
*           [col1, col2, ...]需要查询出的字段名称数组,
*           其中, 如果未指定表名, 则默认为第一个表的元素.
* @param groupSql: 
*           group by子句, 不会对内容进行验证; 应包含group by关键字.
* @param orderby: 
*           orderby by子句, {key:true/false} true-means asc, false-means desc.
* @param pageinfo: 
*           分页信息; {offset:0, limit:100}; 默认为 offset=0, limit=100;
* @param alias: 
*           别名
* @return: sql string.
*/
function sql_select( table, where, query_cols = null, groupSql = null, orderby = null, pageinfo = null, alias = null  ) {

  let index;
  let offset = (pageinfo ? pageinfo.offset : 0) || 0;
  let limit = (pageinfo ? pageinfo.limit : 100) || 100;
  query_cols = query_cols ? table_helper.makeCols(query_cols, table, alias) : '*';

  let alis;
  let alip;

  if (alias) {
    if (alias.indexOf(' ') >= 0) { alis = '('+alias+')'; alip = ''; }
    else { alis = table.tablename + ' AS '+alias; alip = `\`${alias}\`.`; }
  }
  else {
    alis = table.tablename;
    alip = '';
  }

  let sql = "SELECT " + query_cols + " FROM " + alis;
  if (where != null && where != undefined && where.length > 0)
    sql += " WHERE " + (where);

  // group.
  if (groupSql)
    sql += ' ' + groupSql;

  // orderby.
  if (orderby)
  {
    let first = true;
    let sql2 = '';
    for (let k in orderby) {
      let ov;
      if (table.model) {
        let v = table.model[k];
        if (v) {
          ov = '`' + v.map + '`';
        } else {
          ov = k;
        }
      } else {
        ov = k;
      }

      if (first)
        first = false;
      else
        sql2 += ',';

      sql2 += alip + ov + ' ';
      if (!orderby[k])
        sql2 += 'DESC';
    }

    if (sql2.length > 0)
      sql += " ORDER BY " + sql2;
  }

  // limit.
  sql += " LIMIT " + offset + "," + limit;

  return sql;
}

/**
* @desc: count
* @param: where
* @return: sql string.
*/
function sql_count(table, where = null, alias = null) {

  let alis;
  if (alias) {
    if (alias.indexOf(' ') >= 0)  alis = '('+alias+')';
    else alis = table.tablename + ' AS '+alias;
  }
  else {
    alis = table.tablename;
  }

  let sql = "SELECT COUNT(*) FROM " + alis;
  if (!febs.string.isEmpty(where))
    sql += " WHERE " + (where);
  
  return sql;
}