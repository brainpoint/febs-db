'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

const febs     = require('febs');
const assert   = require('assert');

module.exports = class {
  constructor(joinName, adapter, table1, table2) {
    assert(joinName);
    assert(adapter);
    assert(table1);
    assert(table2);
    this.joins = [{joinName, table1, table2}];
    this.adapter = adapter; 

    this.table1 = table1;
    this.table2 = table2;

    this.alias1 = '';
    this.alias2 = '';
  }

  get tablename() { 
    let r = '(' 
          + this.joins[0].table1.tablename + (this.joins[0].alias1 ? ' AS ' + this.joins[0].alias1 : '')  
          + ' ' + this.joins[0].joinName + ' '
          + this.joins[0].table2.tablename + (this.joins[0].alias2 ? ' AS ' + this.joins[0].alias2 : '') 
          + (this.joins[0].on ? ` ON ${this.joins[0].on}` : '')
          + ')';
    for (let i = 1; i < this.joins.length; i++) {
      r = '(' + r
        + ' ' + this.joins[i].joinName + ' '
        + this.joins[i].table2.tablename + (this.joins[i].alias2 ? ' AS ' + this.joins[i].alias2 : '') 
        + (this.joins[i].on ? ` ON ${this.joins[i].on}` : '')
        + ')';
    }

    return r;
  }

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
  * @desc: 设置别名1.(仅第一次join时可以设置).
  * @return: 支持语法糖
  */
  set_alias1(aliasName) {
    if (this.joins.length > 0)
      throw 'can\'t set alias1';

    if (aliasName) {
      if (aliasName == this.joins[0].alias2) {
        throw 'duplicate alias name';
      }
    }
    this.joins[this.joins.length-1].alias1 = aliasName;

    this.alias1 = aliasName? (aliasName+'.') : '';
    return this;
  }

  /**
  * @desc: 设置别名2.
  * @return: 支持语法糖
  */
  set_alias2(aliasName) {
    if (aliasName) {
      if (aliasName == this.joins[0].alias1 || aliasName == this.joins[0].alias2) {
        throw 'duplicate alias name';
      }

      for (let i = 1; i < this.joins.length-1; i++) {
        if (aliasName == this.joins[i].alias2) {
          throw 'duplicate alias name';
        }
      }
    }
    this.joins[this.joins.length-1].alias2 = aliasName;

    this.alias2 = aliasName? (aliasName+'.') : '';
    return this;
  }

  /**
  * @desc: 设置join条件.
  * @return: 支持语法糖
  */
  set_on(onSql) {
    this.joins[this.joins.length-1].on = onSql;
    return this;
  }

  /**
  * @desc: join表. join完新表后其他操作时在新的join上操作.
  * @return: 支持语法糖
  */
  join_inner(tableB) { this.table2 = tableB; this.joins.push({table2:tableB, joinName:'INNER JOIN'}); return this; }
  join_cross(tableB) { this.table2 = tableB; this.joins.push({table2:tableB, joinName:'CROSS JOIN'}); return this; }
  join_left(tableB)  { this.table2 = tableB; this.joins.push({table2:tableB, joinName:'LEFT OUTER JOIN'}); return this; }
  join_right(tableB) { this.table2 = tableB; this.joins.push({table2:tableB, joinName:'RIGHT OUTER JOIN'}); return this; }
  join_full(tableB)  { this.table2 = tableB; this.joins.push({table2:tableB, joinName:'FULL OUTER JOIN'}); return this; }
};