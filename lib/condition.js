'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

const febs     = require('febs');
const assert   = require('assert');
const exception = require('./exception');
const TYPES     = require('./dataType');

const sql_inc      = require('./utils/col_syntax').sql_inc;
const sql_origin   = require('./utils/col_syntax').sql_origin;


module.exports = class {
  constructor(adapter, model) {
    this.adapter = adapter;
    this.model = model;
    for (var key in this.model) {
      if (!this.model[key].hasOwnProperty('map')) {
        this.model[key].map = key;
      }
    }
  }

  /**
  * @desc: 构造一个 key=value的sql条件语句.
  * @return: sql;
  */
  equal( key, value, alias = null ) {
    var t = this.model[key];
    if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);

    return ` ${alias?alias+'.':''}${t.map}=${this.adapter.type_cast(value, t.type, key)} `;
  }

  /**
  * @desc: 构造一个 key>value的sql条件语句.
  * @return: sql;
  */
  more_than( key, value, alias = null ) {
    var t = this.model[key];
    if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);

    return ` ${alias?alias+'.':''}${t.map}>${this.adapter.type_cast(value, t.type, key)} `;
  }

  /**
  * @desc: 构造一个 key>=value的sql条件语句.
  * @return: sql;
  */
  more_equal( key, value, alias = null ) {
    var t = this.model[key];
    if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);

    return ` ${alias?alias+'.':''}${t.map}>=${this.adapter.type_cast(value, t.type, key)} `;
  }


  /**
  * @desc: 构造一个 key<=value的sql条件语句.
  * @return: sql;
  */
  less_equal( key, value, alias = null ) {
    var t = this.model[key];
    if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);

   return ` ${alias?alias+'.':''}${t.map}<=${this.adapter.type_cast(value, t.type, key)} `;
  }


  /**
  * @desc: 构造一个 key<value的sql条件语句.
  * @return: sql;
  */
  less_than( key, value, alias = null ) {
   var t = this.model[key];
   if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);

   return ` ${alias?alias+'.':''}${t.map}<${this.adapter.type_cast(value, t.type, key)} `;
  }


  /**
  * @desc: 构造一个 key<>value的sql条件语句.
  * @return: sql;
  */
  not_equal( key, value, alias = null ) {
    var t = this.model[key];
    if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);

    return ` ${alias?alias+'.':''}${t.map}<>${this.adapter.type_cast(value, t.type, key)} `;
  }

  /**
  * @desc: 构造一个 key LIKE value的sql条件语句.
  *     不对value值进行反义操作.
  * @return: sql;
  */
  like( key, value, alias = null ) {
    if (typeof value !== 'string')
      throw new exception('value is not string', febs.exception.PARAM, __filename, __line);

    var t = this.model[key];
    if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);

    var sql1 = ' ' + t.map + ' LIKE ';
    if (TYPES.isStringType(t.type))
    {
      return ` ${alias?alias+'.':''}${t.map} LIKE ${this.adapter.type_cast(value, t.type, key)} `;
    }
    else
    {
      throw new exception(key + ' is not a text', febs.exception.PARAM, __filename, __line);
    }
  }

  /**
  * @desc: 构造一个 key BETWEEN value1 AND value2的sql条件语句
  * @return: sql;
  */
  between( key, value1, value2, alias = null ) {
    var t = this.model[key];
    if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);

    return ` ${alias?alias+'.':''}${t.map} BETWEEN ${this.adapter.type_cast(value1, t.type, key)} AND ${this.adapter.type_cast(value2, t.type, key)} `;
  }

  /**
  * @desc: 构造一个 key IN (value1, value2, ...) 的sql条件语句
  * @return: sql;
  */
  in( key, valueArray, alias = null ) {
    var t = this.model[key];
    if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);
    if (!(valueArray instanceof Array))
      throw new exception(valueArray.toString() + ' is not array', febs.exception.PARAM, __filename, __line);

    if (valueArray.length == 0)
      return ' 0 ';

    let sql = ` ${alias?alias+'.':''}${t.map} IN (`;

    for (let i = 0; i < valueArray.length; i++) {
      if (i > 0)
        sql += ',';
      sql += this.adapter.type_cast(valueArray[i], t.type, key);
    }
    sql += ') ';
    return sql;
  }

  
  /**
  * @desc: 构造一个 key NOT IN (value1, value2, ...) 的sql条件语句
  * @return: sql;
  */
  not_in( key, valueArray, alias = null ) {
    var t = this.model[key];
    if (!t)
      throw new exception(key + ' is not existed', febs.exception.PARAM, __filename, __line);
    if (!(valueArray instanceof Array))
      throw new exception(valueArray.toString() + ' is not array', febs.exception.PARAM, __filename, __line);

    if (valueArray.length == 0)
      return ' 0 ';

    let sql = ` ${alias?alias+'.':''}${t.map} NOT IN (`;

    for (let i = 0; i < valueArray.length; i++) {
      if (i > 0)
        sql += ',';
      sql += this.adapter.type_cast(valueArray[i], t.type, key);
    }
    sql += ') ';
    return sql;
  }

  /**
  * @desc: 在update中使用, 用于表明sql中字段自增n.
  * @example: col=col+n
  */
  col_inc(n, alias = null) { return new sql_inc(n, alias); }

  /**
  * @desc: 用于表明 col=v, 将不对v进行任何检验.(也不在v字符串两边加'符号)
  */
  col_origin_sql(v) { return new sql_origin(v); }

};