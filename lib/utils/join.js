'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

const febs     = require('febs');
const assert   = require('assert');

module.exports = class {
  constructor(adapter, table1, alias1, table2, alias2, on) {
    this.adapter = adapter;
    this.table1 = table1;
    this.table2 = table2;
    this.alias1 = alias1;
    this.alias2 = alias2;
    this.on = on;
  }

  /**
  * @desc: 获得from sql
  * @return: 
  */
  get sql_from() {}

  /**
  * @desc: 获得on sql
  * @return: 
  */
  get sql_on() {}

  get tablename() { return this.sql_from + ' ' + this.sql_on; }

  /**
  * @desc: 返回sql select.
  *         查询的字段必须明确指明.
  * @return: string
  */
  sql_select(where, opt = null) {
    opt = opt || {};
    let query_cols = opt.cols;
    let groupSql   = opt.groupSql;
    let orderby    = opt.orderby;
    let pageinfo   = {offset:opt.offset, limit:opt.limit};
    return this.adapter.sql_select(this, where, query_cols, groupSql, orderby, pageinfo);
  }

  /**
  * @desc: 设置别名1.
  * @return: 支持语法糖
  */
  set_alias1(aliasName) {
    this.alias1 = aliasName;
    return this;
  }

  /**
  * @desc: 设置别名2.
  * @return: 支持语法糖
  */
  set_alias2(aliasName) {
    this.alias2 = aliasName;
    return this;
  }

  /**
  * @desc: 设置join条件.
  * @return: 支持语法糖
  */
  set_on(onSql) {
    this.on = onSql;
    return this;
  }
};