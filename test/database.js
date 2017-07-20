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
var co        = require('co');


//--------------------------------------------------------
// 
module.exports = class Test extends database {
  constructor() {
    // create.
    super('mssql', {
      queryTimeout      : 5000,
      connectTimeout    : 5000,
      acquireTimeout    : 5000,
      queueLimit        : 200,
      connectionLimit   : 10,
      host              : '',
      port              : 14434,
      user              : '',
      password          : '',
      database          : '',
      encrypt           : true,
    });

    // table.
    this.registerTable(new (require('./table1'))(), 'tableA');
    this.registerTable(new (require('./table2'))(), 'tableB');
  }

};


