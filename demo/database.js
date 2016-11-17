'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */

var citong   = require('citong');
var database  = require('citong-db').database;

module.exports = class {
  constructor(cfg) {
    // create.
    this.db = new database(cfg);

    // table.
    this.dbtable1   = new (require('./table1'))(this.db);
  }

  /**
  * @desc: query.
  * @return: 
  */
  *queryExample() {
    yield this.dbtable1.queryById(...);
  }

  
};

