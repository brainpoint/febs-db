'use strict';
/**
* Copyright (c) 2017 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

const febs  = require('febs');
const TYPES = require('../dataType');
const type_cast = require('./type_cast');
const exception = require('../exception');

const sql_inc      = require('../utils/col_syntax').sql_inc;
const sql_origin   = require('../utils/col_syntax').sql_origin;


module.exports = {
  makeColsKeysAndValues,
  makeColsKeyPairs,
  makeCols,
  makePrimaryValues,
}

/**
* @desc: make (no contain 'key===true' col. and check col size)
*         the string1: `col1`,`col2`,...,`coln`
*         the string2: value1,value2,...,valuen
* @return: [string1, string2].
*/
function makeColsKeysAndValues( item, table, alias ) {

  alias = `${(alias&&alias.indexOf(' ')<0)?'`'+alias+'`.':''}`;

  let sql1 = '';
  let sql2 = '';

  let first = true;
  for (var k in item) {
    // if (k == this.idKeyName)
    //   continue;
    let vv = item[k];
    if (vv == null || vv == undefined)
      continue;

    var v = table._model[k];
    if (v != undefined) {
      if (TYPES.isIntegerType(v.type) && v.key === true) {
        continue;
      }

      if (first) {
        first = false;
      } else {
        sql1 += ',';
        sql2 += ',';
      }

      sql1 += alias + '`' + k + '`';
      if (vv instanceof sql_origin) {
        sql2 += vv.v;
      } 
      else if (vv instanceof sql_inc) {
        if (!TYPES.isIntegerType(v.type))
          throw new exception(vv.toString() + ' inc type error', exception.DB_SqlException, __filename, __line);
          
        sql2 += alias + '`' + k + '`+' + vv.n;
      } else {
        sql2 += type_cast(vv, v.type, k);
      }
    } else {
      console.debug(`'${k}' isn't in table '${table._tablename}' defined.`);
    }
  } // for.

  return [sql1, sql2];
}

/**
* @desc: make (no contain 'key===true' col and primary key.)
*         the string: `col1`=v1,`col2`=v2,...,`coln`=vn
* @return: string.
*/
function makeColsKeyPairs( item, table, alias ) {
  
  alias = `${(alias&&alias.indexOf(' ')<0)?'`'+alias+'`.':''}`;

  let sql1 = '';

  let first = true;
  for (var k in item) {
    if (table._idKeyName instanceof Array) {
      if (table._idKeyName.indexOf(k) >= 0)
        continue;
    } else if (k == table._idKeyName) {
      continue;
    }

    let vv = item[k];
    if (vv == null || vv == undefined)
      continue;

    var v = table._model[k];
    if (v != undefined) {
      if (v.isPrimary || (v.key === true && TYPES.isIntegerType(v.type))) {
        continue;
      }

      if (first) {
        first = false;
      } else {
        sql1 += ',';
      }
      sql1 += alias + '`' + v.map + '`=';
      if (vv instanceof sql_origin) {
        sql1 += vv.v;
      }
      else if (vv instanceof sql_inc) {
        if (!TYPES.isIntegerType(v.type))
          throw new exception(vv.toString() + ' inc type error', exception.DB_SqlException, __filename, __line);
          
        sql1 += alias + '`' + v.map + '`+' + vv.n;
      } 
      else {
        sql1 += type_cast(vv, v.type, k);
      }
    } else {
      console.debug(`'${k}' isn't in table '${table._tablename}' defined.`);
    }
  } // for.

  return sql1;
}

/**
* @desc: make
*         the string1: `colName1`,`colName2`,...,`colNamen`
*       or '*'
* @return: string1.
*/
function makeCols( item, table, alias ) {

  alias = `${(alias&&alias.indexOf(' ')<0)?'`'+alias+'`.':''}`;

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

    var v = table._model[vv];
    if (v != undefined) {
      sql1 += alias + '`' + vv + '`';
    }
    else {
      sql1 += vv;
    }
  } // for.

  return sql1.length > 0 ? sql1 : '*';
}


/**
* @desc: 构造一个 'id=value' 的sql语句.
*     其中id可以为多主键的值..
* @return: 
*/
function makePrimaryValues(id, table, alias) {
  if (table._idKeyIsCombined && !(id instanceof Object)) {
    throw new exception('params id is error in selectById', exception.DB_SqlException, __filename, __line);
  }

  alias = `${(alias&&alias.indexOf(' ')<0)?'`'+alias+'`.':''}`;

  // combined key.
  let sqlprimary = '';

  if (table._idKeyIsCombined) {
    for (let i = 0; i < table._idKeyName.length; i++) {
      let name = table._idKeyName[i];
      let id2 = id[name];
      if (id2 === undefined || id2 === null) {
        sqlprimary = null;
        break;
      } else {
        if (i > 0)
          sqlprimary += ' AND ';
        sqlprimary += alias + "`" + table._idKeyNameMap[i] + "`=" + type_cast(id2, table._model[name].type, name);
      }
    }
  } else {
    let id2 = id;
    if (id2 !== undefined && id2 !== null) {
      sqlprimary += alias + "`" + table._idKeyNameMap + "`=" + type_cast(id2, table._model[table._idKeyName].type, table._idKeyName);
    }
  }

  if (!sqlprimary) {
    throw new exception('params id is error in selectById', exception.DB_SqlException, __filename, __line);
  }

  return sqlprimary + ' ';
}