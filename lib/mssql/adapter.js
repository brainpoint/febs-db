'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

var mssql      = require('mssql');
var febs       = require('febs');
var assert     = require('assert');
var copy       = require('copy-to');
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
  errHandle,
  exec,
  execProcedure,
  transaction,
  type_cast,
  table_helper,
  opt_cvt,

  add,
  remove,
  update,
  selectLockRow,
  select,
  count,
  exist,
}

// 错误处理.
mssql.on('error', err=>{
  //console.log(err);
});

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

  if (ret.rowsAffected && ret.rowsAffected.length > 0) {
    cret.rowsAffected = ret.rowsAffected[0];
  }
  
  if (ret.recordset && ret.recordset.length > 0) {
    //cret.rowsAffected = ret.recordset.length;
    cret.rows = ret.recordset;

    if (ret.recordset[0].identity) {
      cret.insertId = ret.recordset[0].identity;
      if (typeof cret.insertId === 'string') {
        if (cret.insertId.length >= 13) // 对千亿以上的数值使用bignumber.
          cret.insertId = new BigNumber(cret.insertId);
        else
          cret.insertId = parseInt(cret.insertId);
      }
    }
  } else {
    cret.rows = [];
  }

  return cret;
}

/**
* @desc: 转换查询结果中的数据,按类型转换.
* @return: 
*/
function ret_data_cvt(rows, table) {
  for (let i = 0; i < rows.length; i++) {
    for (let k in rows[i]) {
      let rname = table.getLogicColName(k);
      if (!rname) continue;

      let kk = table.model[rname];
      if (kk) {
        let t = dataType.getType(kk.type);
        // fix bigint col.
        if (typeof rows[i][kk.map] === 'string' && t === dataType.BigInt) {
          if (rows[i][kk.map].length >= 13)
            rows[i][kk.map] = new BigNumber(rows[i][kk.map]);
          else
            rows[i][kk.map] = parseInt(rows[i][kk.map]);
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
* @desc: get mssql data type.
* @return: 
*/
function data_type_cvt(type) {

  if (type.type === dataType.VarChar)
    return mssql.VarChar(type.length);
  else if (type.type === dataType.NVarChar)
    return mssql.NVarChar(type.length);
  else if (type.type === dataType.Text)
    return mssql.Text;
  else if (type.type === dataType.NText)
    return mssql.NText;
  else if (type.type === dataType.Char)
    return mssql.Char(type.length);
  else if (type.type === dataType.NChar)
    return mssql.NChar(type.length);
  else if (type.type === dataType.Bit)
    return mssql.Bit;
  else if (type.type === dataType.BigInt)
    return mssql.BigInt;
  else if (type.type === dataType.TinyInt)
    return mssql.TinyInt;
  else if (type.type === dataType.SmallInt)
    return mssql.SmallInt;
  else if (type.type === dataType.Int)
    return mssql.Int;
  else if (type.type === dataType.Float)
    return mssql.Float;
  else if (type.type === dataType.Numeric)
    return mssql.Numeric(type.precision, type.scale);
  else if (type.type === dataType.Decimal)
    return mssql.Decimal(type.precision, type.scale);
  else if (type.type === dataType.Real)
    return mssql.Real;
  else if (type.type === dataType.DateTime)
    return mssql.SmallDateTime;
  else if (type.type === dataType.Binary)
    return mssql.Binary;
  else if (type.type === dataType.VarBinary)
    return mssql.VarBinary(type.length);
  else
    throw new exception(febs.exception.PARAM, febs.exception.PARAM, __filename, __line);
}

/**
* @desc: 执行事务过程.
* @return: 
*/
async function do_transaction(db, fooCB, resolve, reject, conn, needCommit) {  
  try {
    let r = await fooCB(db);

    if (r === true) {
      if (needCommit) {
        conn.commit(err => {
          console.debug('[COMMIT] ' + (err?"err":"ok"));
          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, 'COMMIT TRAN');
          } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }

          if (err) {
            reject(handle_err('COMMIT', err, __filename, __line));
          } else {
            resolve(true);
          }
        });
      }
      else {
        resolve(true);
      }
    }
    else {
      let db1 = db.__db || db;
      if (!db1.__rolledBack)
      {
        conn.rollback(err=>{
          console.debug('[ROLLBACK] ' + (err?"err":"ok"));
          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, 'ROLLBACK TRAN');
          } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }
          
          if (err) {
            reject(handle_err('ROLLBACK', err, __filename, __line));
          } else {
            resolve(false);
          }
        });
      } else {
        reject(handle_err('ROLLBACK', 'rollback', __filename, __line));
      }
      
      if (needCommit)
        db._destroy();
    } // if..else.
  }
  catch (e) {
    let db1 = db.__db || db;
    if (!db1.__rolledBack) {
      conn.rollback((err)=>{
        console.debug('[ROLLBACK] ' + (err?"err":"ok"));
        try {
          if (db.sqlLogCallback) db.sqlLogCallback(err, 'ROLLBACK TRAN');
        } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }
        
        if (err) {
          db._destroy();
          reject(handle_err('ROLLBACK', e, __filename, __line));
        } else {
          db._destroy();
          reject(handle_err('ROLLBACK', e, __filename, __line));
        }
      });
    } else {
      db._destroy();
      reject(handle_err('ROLLBACK', e, __filename, __line));
    }
  }
}

/**
* @desc: 执行存储过程
* @return: 
*/
function do_procedure(db, req, name, params, resolve, reject, filename, line) {
  try {
    for (let i = 0; i < params.params.length; i++) {
      let pi = params.params[i];
      if (pi.in) {
        req = req.input(pi.name, data_type_cvt(pi.type), pi.value);
      } else {
        req = req.output(pi.name, data_type_cvt(pi.type));
      }
    } // for.
  } catch (e) {
    reject(handle_err('exec ' + name + ' ...', e, filename, line)); return; 
  }

  req.execute(name, (err, result) => {
    try {
      if (db.sqlLogCallback) db.sqlLogCallback(err, 'exec ' + name + ' ...');
    } catch (e) {
      reject(handle_err('sqlLogCallback', e, filename, line)); return; 
    }

    if (err) { reject(handle_err('exec ' + name + ' ...', err, filename, line)); return; }
    let cret = ret_cvt(result);
    cret.out = result.output;
    resolve(cret);
  });
}

/**
* @desc: 执行未连接上之前的等待语句.
* @return: 
*/
function do_wait(db, pool, filename, line) {
  // 执行等待exec列表.
  if (db.__waitExecArray) {
    for (let i = 0; i < db.__waitExecArray.length; i++) {
      let e = db.__waitExecArray[i];

      // sql.
      if (e.type === 's') {
        let req = new mssql.Request(pool); // or: new sql.Request(pool1) 
        req.query(e.sql, (err, result) => {
          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, e.sql);
          } catch (err) { e.reject(handle_err('sqlLogCallback', err, filename, line)); return; }

          if (err) { 
            e.reject(handle_err(e.sql, err, filename, line)); 
          }
          else
            e.resolve(ret_cvt(result));
        });
      }
      // producure.
      else if (e.type === 'p') {
        let req = new mssql.Request(pool); // or: new sql.Request(pool1) 
        do_procedure(db, req, e.name, e.params, e.resolve, e.reject, filename, line);
      } 
      // transaction.
      else if (e.type === 't') {
        const trans_conn = new mssql.Transaction(pool);
        trans_conn.begin(e.sqlLevel, err=>{
          if (err) {
            e.reject(handle_err('begin tran', err, __filename, __line));
          }
          else {
            console.debug('[Transaction] begin ' + e.sqlLevel);
            
            try {
              if (db.sqlLogCallback) db.sqlLogCallback(err, 'SET TRANSACTION ISOLATION LEVEL '+e.sqlLevel);
              if (db.sqlLogCallback) db.sqlLogCallback(err, 'BEGIN TRAN');
            } catch (err) { e.reject(handle_err('sqlLogCallback', err, filename, line)); return; }

            let db1 = db._cloneWithConn(trans_conn);
            db1.__db = db;
            
            trans_conn.on('rollback', aborted => {
              // emited with aborted === true 
              db.__rolledBack = true;
              if (db.sqlLogCallback) db.sqlLogCallback(null, 'ROLLBACK TRAN');
            })

            do_transaction(db1, e.fooCB, e.resolve, e.reject, trans_conn, true);
          }
        });
      }
      else {
        throw new exception('wait exec type is error', exception.DB_CommonException, __filename, __line);
      } // if..else.
    } // for.
    db.__waitExecArray = [];
  } // if.    
}


/**
* @desc: reject未连接上之前的等待语句.
* @return: 
*/
function reject_wait(db, err, filename, line) {
  // 执行等待exec列表.
  if (db.__waitExecArray) {
    for (let i = 0; i < db.__waitExecArray.length; i++) {
      let e = db.__waitExecArray[i];
      e.reject(handle_err(e.sql, err, filename, line)); 
    }
    db.__waitExecArray = [];
  }
}

/**
* @desc: convert opt to mssql opt.
* @return: 
*/
function opt_cvt(opt) {
  opt.connectionTimeout  = opt.hasOwnProperty('connectTimeout') ? opt.connectTimeout : 5000;
  opt.requestTimeout     = opt.hasOwnProperty('queryTimeout') ? opt.queryTimeout : 5000;
  opt.pool = {};
  opt.pool.acquireTimeoutMillis = opt.hasOwnProperty('acquireTimeout') ? opt.acquireTimeout : 5000;
  opt.pool.maxWaitingClients    = opt.hasOwnProperty('queueLimit') ? opt.queueLimit : 200;
  opt.pool.max                  = opt.hasOwnProperty('connectionLimit') ? opt.connectionLimit : 10;
  opt.server             = opt.host;
  opt.port               = opt.hasOwnProperty('port') ? opt.port : 3306;
  opt.database           = opt.database;
  opt.user               = opt.user;
  opt.password           = opt.password;

  // if (opt.encrypt) {
    opt.options            = {encrypt:true};
  // }

  return opt;
}

function escape_like(str) {
  // str = febs.string.replace(str, "\\", "\\\\");
  str = febs.string.replace(str, "'", "''");
  str = febs.string.replace(str, "[", "[[]");
  str = febs.string.replace(str, "%", "[%]");
  return febs.string.replace(str, "_", "[_]");
}

/**
* @desc: create connection pool.
* @return: 
*/
function createPool(opt) {
  const pool1 = new mssql.ConnectionPool(opt);
  return pool1;
}

/**
* @desc: 进行db的错误处理.
* @return: 
*/
function errHandle(db, pool) {
  pool.on('error', err=>{
    let e = handle_err(null, err, __filename, __line);
    if (e.code == exception.DB_ConnectException) {
      reject_wait(db, e, __filename, __line);
    }
  })
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

      let db1 = db.__db || db;
      if (db1.__rolledBack) {
        reject(handle_err(sql, 'already rollbacked', __filename, __line));
        return;
      }

      // use new conn.
      if (!conn) {
        // other is connecting.
        if (pool.connecting) {
          db1.__waitExecArray = db1.__waitExecArray || [];
          db1.__waitExecArray.push({type:'s',sql,resolve,reject});
        }

        // to connect pool.
        else if (!pool.connected) {
          pool.connect(err=>{
            if (err) {
              // 执行等待exec列表.
              reject_wait(db1, err, __filename, __line);
              reject(handle_err(sql, err, __filename, __line)); 
              return;
            }

            // 执行等待exec列表.
            try {
              do_wait(db1, pool, __filename, __line);
            } catch (err) { reject(handle_err('do_wait', err, __filename, __line)); return; }

            let req = new mssql.Request(pool); // or: new sql.Request(pool1) 
            req.query(sql, (err, result) => {
              try {
                if (db.sqlLogCallback) db.sqlLogCallback(err, sql);
              } catch (err) { reject(handle_err('sqlLogCallback', err, __filename, __line)); return; }

              if (err) { reject(handle_err(sql, err, __filename, __line)); return; }
              resolve(ret_cvt(result));
            });
          });
        }

        // query.
        else {
          let req = new mssql.Request(pool); // or: new sql.Request(pool1) 
          req.query(sql, (err, result) => {
            try {
              if (db.sqlLogCallback) db.sqlLogCallback(err, sql);
            } catch (err) { reject(handle_err('sqlLogCallback', err, __filename, __line)); return; }

            if (err) { reject(handle_err(sql, err, __filename, __line)); return; }
            resolve(ret_cvt(result));
          });
        }
      } else {
        let req = new mssql.Request(conn);
        req.query(sql, (err, result)=>{
          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, sql);
          } catch (err) { reject(handle_err('sqlLogCallback', err, __filename, __line)); return; }

          if (err) { reject(handle_err(sql, err, __filename, __line)); return; }
          resolve(ret_cvt(result));
        });
      }
    } catch (e) {
      if (needRelease && conn) conn.close();
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

    let db1 = db.__db || db;
    if (db1.__rolledBack) {
      reject(handle_err(sql, 'already rollbacked', __filename, __line)); return;
    }

    let needRelease = false;
    let sql;
    try {
      // use new conn.
      if (!conn) {
        // other is connecting.
        if (pool.connecting) {
          let params1 = {};
          copy(params).to(params1);
          db1.__waitExecArray = db1.__waitExecArray || [];
          db1.__waitExecArray.push({type:'p',name, params:params1,resolve,reject});
        }

        // to connect pool.
        else if (!pool.connected) {
          pool.connect(err=>{
            if (err) {
              // 执行等待exec列表.
              reject_wait(db1, err, __filename, __line);
              reject(handle_err(sql, err, __filename, __line));
              return;
            }

            // 执行等待exec列表.
            try {
              do_wait(db1, pool, __filename, __line);
            } catch (err) { reject(handle_err('do_wait', err, __filename, __line)); return; }

            let req = new mssql.Request(pool); // or: new sql.Request(pool1) 
            do_procedure(db1, req, name, params, resolve, reject, __filename, __line);
          });
        }

        // query.
        else {
          let req = new mssql.Request(pool); // or: new sql.Request(pool1) 
          do_procedure(db1, req, name, params, resolve, reject, __filename, __line);
        }
      } else {
        let req = new mssql.Request(conn); // or: new sql.Request(pool1) 
        do_procedure(db1, req, name, params, resolve, reject, __filename, __line);
      }
    } catch (e) {
      if (needRelease && conn) conn.close();
      reject(handle_err(sql, e, __filename, __line));
    }
  });
}



/**
* @desc: transaction.
* @param fooCB: async function(database):boolean {}, 返回false则rollback, 返回true则commit.
* @return: (Promise).
*/
function transaction(db, isolationLevel1, fooCB) {
  assert(db);

  return new PromiseLib((resolve, reject)=>{
    if (!fooCB || (typeof fooCB !== 'function')) {
      reject(new exception(febs.exception.PARAM, febs.exception.PARAM, __filename, __line));
      return;
    }

    if (db._transactionConn) {
      assert(!db.pool);
      console.debug('[Recursion Transaction]');
      do_transaction(db, fooCB, resolve, reject, db._transactionConn, false);
    }
    else {

      let sqlLevel;
      let sqlLevelSql;
      if (isolationLevel1 == isolationLevel.Read_committed) {
        sqlLevel = mssql.ISOLATION_LEVEL.READ_COMMITTED;
        sqlLevelSql = 'READ COMMITTED';
      } else if (isolationLevel1 == isolationLevel.Read_uncommitted) {
        sqlLevel = mssql.ISOLATION_LEVEL.READ_UNCOMMITTED;
        sqlLevelSql = 'READ UNCOMMITTED';
      } else if (isolationLevel1 == isolationLevel.Repeatable_read) {
        sqlLevel = mssql.ISOLATION_LEVEL.REPEATABLE_READ;
        sqlLevelSql = 'REPEATABLE READ';
      } else if (isolationLevel1 == isolationLevel.Serializable) {
        sqlLevel = mssql.ISOLATION_LEVEL.SERIALIZABLE;
        sqlLevelSql = 'SERIALIZABLE';
      } else {
        reject(new exception(febs.exception.PARAM, febs.exception.PARAM, __filename, __line));
        return;
      }
      
      assert(db.pool);

      let pool = db.pool;

      // other is connecting.
      if (pool.connecting) {
        db = db.__db || db;
        db.__waitExecArray = db.__waitExecArray || [];
        db.__waitExecArray.push({type:'t',db, sqlLevel, fooCB, resolve, reject});
      }

      // to connect pool.
      else if (!pool.connected) {
        pool.connect(err=>{
          if (err) {
            // 执行等待exec列表.
            reject_wait((db.__db || db), err, __filename, __line);
            reject(handle_err(sql, err, __filename, __line));
            return;
          }

          // 执行等待exec列表.
          try {
            do_wait((db.__db || db), pool, __filename, __line);
          } catch (err) { reject(handle_err('do_wait', err, __filename, __line)); return; }

          const trans_conn = new mssql.Transaction(pool);
          trans_conn.begin(sqlLevel, err=>{
            if (err) {
              reject(handle_err('begin tran', err, __filename, __line));
              return;
            }

            console.debug('[Transaction] begin ' + sqlLevelSql);

            try {
              if (db.sqlLogCallback) db.sqlLogCallback(err, 'SET TRANSACTION ISOLATION LEVEL '+sqlLevelSql);
              if (db.sqlLogCallback) db.sqlLogCallback(err, 'BEGIN TRAN');
            } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }

            let db1 = db._cloneWithConn(trans_conn);
            db1.__db = db;
            
            trans_conn.on('rollback', aborted => {
              // emited with aborted === true 
              if (db.sqlLogCallback) db.sqlLogCallback(null, 'ROLLBACK TRAN');
              db.__rolledBack = true;
            })

            do_transaction(db1, fooCB, resolve, reject, trans_conn, true);
          });

        });
      }

      // query.
      else {
        const trans_conn = new mssql.Transaction(pool);
        trans_conn.begin(sqlLevel, err=>{
          if (err) {
            reject(handle_err('begin tran', err, __filename, __line));
            return;
          }

          console.debug('[Transaction] begin ' + sqlLevelSql);

          try {
            if (db.sqlLogCallback) db.sqlLogCallback(err, 'SET TRANSACTION ISOLATION LEVEL '+sqlLevelSql);
            if (db.sqlLogCallback) db.sqlLogCallback(err, 'BEGIN TRAN');
          } catch (e) { reject(handle_err('sqlLogCallback', e, __filename, __line)); return; }

          let db1 = db._cloneWithConn(trans_conn);
          db1.__db = db;
          
          trans_conn.on('rollback', aborted => {
            // emited with aborted === true 
            if (db.sqlLogCallback) db.sqlLogCallback(null, 'ROLLBACK TRAN');
            db.__rolledBack = true;
          })

          do_transaction(db1, fooCB, resolve, reject, trans_conn, true);
        });
      } // if..else.
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
    if (table.idKeyNameAutoInc && ret.insertId) {
      item[table.idKeyNameAutoInc] = ret.insertId;
    }

    return (ret.rowsAffected > 0) ? true : false;
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
    return (ret.rowsAffected > 0) ? true : false;
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
    return (ret.rowsAffected > 0) ? true : false;
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
*   ret - mod array.
*/
function selectLockRow( table, id, query_cols = null, alias = null ) {
  if (!table.db._transactionConn) {
    throw new exception('selectLockRow only call in transaction', exception.DB_CommonException, __filename, __line);
  }
  
  return table.db.exec(sql_selectLockRow(table, id, query_cols, alias))
  .then(ret=>{
    return ret_data_cvt(ret.rows, table);
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
  .then(ret1=>{
    return ret_data_cvt(ret1.rows, table);
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
    return (ret && ret.rows.length >= 1) ? ret.rows[0].a : -1;
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
        sqlprimary += table.idKeyName[i] + "=" + type_cast(id2, table.model[table.idKeyName[i]].type, table.idKeyName[i]);
      }
    }
  } else {
    let id2 = id;
    if (id2 !== undefined && id2 !== null) {
      sqlprimary += table.idKeyName + "=" + type_cast(id2, table.model[table.idKeyName].type, table.idKeyName);
    } else {
      sqlprimary = null;
    }
  }

  if (!sqlprimary) {
    throw new exception('params id is error in isExist', exception.DB_ERROR_SQL, __filename, __line);
  }

  return table.db.exec(sql_count(table, sqlprimary, alias))
  .then(ret=>{
    return (ret && ret.rows.length >= 1) ? ret.rows[0].a > 0 : false;
  });
}


/**
* @desc: add
* @return: sql string.
*/
function sql_add( table, item ) {
  assert(item != null && item != undefined);
  let sqlv = table_helper.makeColsKeysAndValues(item, table);
  let sql = "INSERT INTO " + table.tablename + " (" + sqlv[0] + ") VALUES(" + sqlv[1] + ")";

  if (table.idKeyNameAutoInc) {
    sql += ';select @@IDENTITY AS \'identity\'';
  }
  return sql;
}

/**
* @desc: remove
* @return: sql string.
*/
function sql_remove( table, where ) {
  assert(where != null && where != undefined && where.length > 0);
  let sql = "DELETE FROM " + table.tablename + " WHERE " + (where);
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
  let sql = "UPDATE " + table.tablename + " SET " + sqlv + " WHERE ";

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
        sqlprimary += table.idKeyName[i] + "=" + type_cast(id, table.model[name].type, name);
      }
    }
  } else {
    let id = item[table.idKeyName];
    if (id !== undefined && id !== null) {
      sqlprimary += table.idKeyName + "=" + type_cast(id, table.model[table.idKeyName].type, table.idKeyName);
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
  
  let sql = "SELECT " + query_str + " FROM " + alis + " with (rowlock,UpdLock) WHERE " + sqlprimary;
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
    else { alis = table.tablename + ' AS '+alias; alip = `${alias}.`; }
  }
  else {
    alis = table.tablename;
    alip = '';
  }

// SELECT TOP 20 * 
// FROM
//     (
//         SELECT ROW_NUMBER() OVER (ORDER BY id) AS RowNumber,* FROM table1
//     )   as A  
// WHERE RowNumber > 20*(10-1) 

  // orderby.
  let sqlOrderby = '';
  if (orderby)
  {
    let first = true;
    for (let k in orderby) {
      let v = table.model[k];
      if (!v)
          continue;

      if (first)
        first = false;
      else
        sqlOrderby += ',';

      sqlOrderby += alip + v.map + ' ';
      if (!orderby[k])
        sqlOrderby += 'DESC';
    }
  } 
  
  if (sqlOrderby.length <= 0) {
    sqlOrderby = ((table.idKeyName instanceof Array) ? table.idKeyName[0] : table.idKeyName);
  }
  if (sqlOrderby.length <= 0) {
    for (let key in table.model) {
      sqlOrderby = table.model[key].map;
      break;
    }
  }

  let sql = "SELECT TOP " + limit + ' * FROM (';
  sql += "SELECT ROW_NUMBER() OVER (ORDER BY " + sqlOrderby + ') AS RowNumber,';
  sql += query_cols + " FROM " + alis;

  // where.
  if (where != null && where != undefined && where.length > 0)
  sql += " WHERE " + (where);

  // group.
  if (groupSql)
    sql += ' ' + groupSql;

  // limit.
  sql += ') AS A WHERE RowNumber > ' + offset;

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

  let sql = "SELECT COUNT(*) AS a FROM " + alis;
  if (!febs.string.isEmpty(where))
    sql += " WHERE " + (where);
  
  return sql;
}