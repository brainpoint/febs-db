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
// 数据表.
class notify extends table {
  constructor(dbclient) {
    super(dbclient, 'notify', 'id',
    {
      id:               {type: 'integer', size:8, key: true}, // the auto-incrementing primary key
      is_read:          {type: 'boolean'},
      title:            {type: 'text',    size: 40},
    });
  }
}

//--------------------------------------------------------
// 
class Test {
  constructor() {
    // create.
    this.db = new database('mysql', {
      queryTimeout      : 5000,
      connectTimeout    : 5000,
      waitForConnections: true,
      
      acquireTimeout    : 5000,
      queueLimit        : 20,
      connectionLimit   : 5,
      supportBigNumbers : true,
      bigNumberStrings  : false,  // number -> string only when number overflow in js.
      host              : '',
      port              : 3306,
      user              : '',
      password          : '',
      database          : '',
    });
    // table.
    this.dbNotify   = new notify(this.db);
  }

  /**
  * @desc: query.
  * @return: 
  */
  *queryExample() {
    try {
      let ret;
      ret = yield this.dbNotify.count();
      console.log( ret );
      ret = yield this.dbNotify.add({is_read:true, title:'test1'});
      console.log( ret );
      ret = yield this.dbNotify.isExist(1);
      console.log( ret );
      tap.pass('ok');
    } catch(e) {
      console.log(e);
    }
  }
};

co(function* () {
  var test = new Test();
  yield test.queryExample();
});

