'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */


const febs     = require('febs');
const assert   = require('assert');
const exception = require('./exception');
const TYPES     = require('./dataType');
const condition    = require('./condition');

module.exports = class tablebase {

  /**
  * @param idKeyName: 主键. 单主键时为主键名, 多主键时为主键名数组.
  * @param tablename: 本表名.
  * @param model: 本表模型.
  */
  constructor(tablename, idKeyName, model) {
    this._tablename = tablename;
    this._model = model;
    this._modelMap = {};
    for (var key in this._model) {
      if (!this._model[key].hasOwnProperty('map')) {
        this._model[key].map = key;
      }
      this._modelMap[this._model[key].map] = key;
    }
    if (__debug) {
      let map = {};
      for (var key in this._model) {
        if (map.hasOwnProperty(this._model[key].map))
          throw new exception('the map is duplication, ' + this._model[key].map + ' in table ' + tablename, exception.DB_CommonException, __filename, __line);
        map[key] = true;
      }
    }
    this._idKeyName = idKeyName;
    this._idKeyIsCombined = (idKeyName instanceof Array);
    if (this._idKeyIsCombined) {
      this._idKeyNameMap = [];
      for (let i = 0; i < this._idKeyName.length; i++) {
        let kk = this._model[this._idKeyName[i]];
        kk.isPrimary = true;
        this._idKeyNameMap.push(kk.map);
        if (kk.key === true && TYPES.isIntegerType(kk.type)) {
          this._idKeyNameAutoInc = this._idKeyName[i];
        }
      }
    } else {
      let kk = this._model[this._idKeyName];
      this._idKeyNameMap = kk.map;
      kk.isPrimary = true;
      if (kk.key === true && TYPES.isIntegerType(kk.type)) {
        this._idKeyNameAutoInc = this._idKeyName; 
      }
    }
  }


  /**
  * @desc: add
  *         (insertId will set to item.id)
  * @return: Promise.
  * @resolve:
  *   ret - boolean.
  */
  add( item ) { return this.adapter.add(this, item); }

  /**
  * @desc: remove
  * @return: Promise.
  * @resolve:
  *   ret - boolean.
  */
  remove( where ) { return this.adapter.remove(this, where); }

  /**
  * @desc: update data.
  *         if item.id is existed, sql condition is: 'id=value' AND (where)
  *         otherwise sql condition is: where 
  * @param item, where.
  * @return: Promise.
  * @resolve:
  *   ret - boolean.
  */
  update( item, where = null ) { return this.adapter.update(this, item, where); }

  /**
  * @desc: select by id and lock row for update (use in transaction).
  *         id is Object if table is combined primary. 
  * @param id: 主鍵值.
  * @param cols:
  *           需要查询出的字段名称数组, 例如:[col1, col2, ...].
  * @return: Promise.
  * @resolve:
  *   ret - mod array.
  */
  selectLockRow( id, cols = null ) { return this.adapter.selectLockRow(this, id, cols); }


  /**
  * @desc: select.
  *         sql的连接顺序为: SELECT cols FROM table where groupSql orderby pageInfo.
  *
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
  select( where, opt = null ) { return this.adapter.select(this, where, opt); }

  /**
  * @desc: count
  * @param: where
  * @return: Promise.
  * @resolve:
  *   ret - number.
  */
  count(where = null) { return this.adapter.count(this, where); }

  /**
  * @desc: exist
  *         id is Object if table is combined primary. 
  * @return: Promise.
  * @resolve:
  *   ret - boolean.
  */
  exist(id) { return this.adapter.exist(this, id); }


  /**
  * @desc: 真實的表名称.
  * @return: string.
  */
  get tablename()    { let nm = this._mapName || this._tablename; return this._db.opt.table_prefix ? this._db.opt.table_prefix+nm : nm; }

  /**
  * @desc: 条件构造对象，使用此对象可以在类型安全的情况下构造查询条件.
  * @return: 
  */
  get condition()    { return this._condition; }

  /**
  * @desc: 使用字段的映射名称获得字段的逻辑名称.
  * @return: string; 找不到返回undefined.
  */
  getLogicColName(mapName)  { return this._modelMap[mapName]; }

  get model()       { return this._model; }
  get idKeyName()   { return this._idKeyName; }
  get adapter()     { return this._adapter; }
  get idKeyIsCombined()      { return this._idKeyIsCombined; }
  get idKeyNameAutoInc()     { return this._idKeyNameAutoInc; }
  get db()                   { return this._db; }
};