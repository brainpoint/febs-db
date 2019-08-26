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

    this.db = this.table1.db;
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

    // 对cols中数据进行添加别名.
    if (opt.cols) {
      for (let i = 0; i < opt.cols.length; i++) {
        let cc = opt.cols[i];
        if (cc.indexOf('.') < 0) {
          let cc2 = cc.split(' ')[0];

          let kk = this.table1.model[cc2];
          if (kk) {
            opt.cols[i] = this.alias1 + '.' + opt.cols[i];
          }
          else {
            kk = this.table2.model[cc2];
            if (kk) {
              opt.cols[i] = this.alias2 + '.' + opt.cols[i];
            }
          }
        }
      } // for.
    } // if.

    return this.adapter.sql_select(this, where, query_cols, groupSql, orderby, pageinfo);
  }

  /**
  * @desc: 设置别名1.(仅第一次join时可以设置).
  * @return: 支持语法糖
  */
  set_alias1(aliasName) {
    if (this.joins.length > 1)
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


  /**
  * @desc: query
  *         sql的连接顺序为: SELECT query_cols FROM  where groupSql orderby pageInfo.
  * @description:
  *         与tablebase.select() 不同的是: cols中的字段无需使用 "别名.colName";
  *         colName优先匹配table1中字段.
  * @param where:
  *           查询条件,不会对此字符串验证. 使用 condition 对象进行构建.
  * @param opt: 查询选项. 可以包含以下键值.
  *         - cols:  需要查询出的字段名称数组; 例如: [col1, col2, ...]; 不指定则为查询全部.
  *         - groupSql:   group by子句, 不会对内容进行验证; 应包含group by关键字.
  *         - orderby:    orderby by子句, 例如: {key:true/false} true-means asc, false-means desc..
  *         - offset:     分页查询起始位置.
  *         - limit:      分页查询查询行数.
  * @return: Promise.
  * @resolve:
  *   ret - mod array.
  */
  select( where, opt = null ) {
    return this.db.exec(this.sql_select(where, opt))
    .then(ret=>{
      if (ret.rows)
        return this.db.ret_data_cvt(ret.rows, this.table1, this.table2);
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
  count(where = null) {
    return this.adapter.count(this, where);
  }

};