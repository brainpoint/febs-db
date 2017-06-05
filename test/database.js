'use strict';

/**
 * Copyright (c) 2015 Copyright citongs All Rights Reserved.
 * Author: lipengxiang
 * Desc:
 */

var tap       = require('tap');
var febs      = require('febs');
var database  = require('..').database;
var table     = require('..').table;
var exception = require('..').exception;
var co        = require('co');


//--------------------------------------------------------
// 
module.exports = class Test extends database {
  constructor() {
    // create.

    // super('mysql', {
    //   queryTimeout      : 5000,
    //   connectTimeout    : 5000,
    //   acquireTimeout    : 5000,
    //   queueLimit        : 20,
    //   connectionLimit   : 5,
    //   host              : '112.124.106.204',
    //   port              : 3306,
    //   user              : 'test',
    //   password          : 'test',
    //   database          : 'test',
    // });
    super('mssql', {
      queryTimeout      : 5000,
      connectTimeout    : 5000,
      acquireTimeout    : 5000,
      queueLimit        : 20,
      connectionLimit   : 5,
      host              : '106.14.1.123',
      port              : 14434,
      user              : 'tester',
      password          : 'My@Super@Secret',
      database          : 'testdb',
    });

    // table.
    this.registerTable(new (require('./table1'))());
    this.registerTable(new (require('./table2'))());
  }

};


