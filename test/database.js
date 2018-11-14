'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */

var tap       = require('tap');
var febs      = require('febs');
var database  = require('../lib').database;
var table     = require('../lib').table;
var exception = require('../lib').exception;
var cfg       = require('./cfg');
var co        = require('co');


//--------------------------------------------------------
// 
module.exports = class Test extends database {
  constructor() {
    // create.
    super(cfg.type, cfg);

    // table.
    this.registerTable(new (require('./table1'))(), 'tableA');
    // this.registerTable(new (require('./table2'))(), 'tableB');
    // this.registerTable(new (require('./table3'))());
  }

};


