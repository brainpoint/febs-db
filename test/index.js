'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

var colors = require('colors');
var febs   = require('febs');
var database = require('./database');
var table1   = require('./table1');


__debug = true;
var db = new database();

// set sql log callback.
db.sqlLogCallback = function(err, sql) {
//   console.log(`
// ${febs.utils.getTimeString(Date.now(), '[yyyy-MM-dd hh:mm:ss]')}
// ${sql.green}
//   `);
}

// var add   = require('./_add');
// add.test_async(db);
// add.test_yield(db);
// add.test_promise(db);

// var remove   = require('./_remove');
// remove.test(db);

// var select   = require('./_select');
// select.test_condition(db);
// select.test(db);
// select.testProcedure(db);

// var count    = require('./_count');
// count.test(db);
// count.testWhere(db);

// var exist    = require('./_exist');
// exist.test(db);

// var update    = require('./_update');
// update.test(db);

// var transaction = require('./_transaction');
// transaction.test(db);


// 每10s执行一次, 测试重新连接.
var test    = require('./_test');
setInterval(()=>{
  test.test(db);
  test.test(db);
  test.test(db);
  test.test(db);
  test.test(db);
  test.test(db);
  test.test(db);
  test.test(db);
  test.test(db);
}, 500);
