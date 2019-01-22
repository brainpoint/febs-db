'use strict';
/**
* Copyright (c) 2017 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

var assert = require('assert');


//--------------------------------------------------------
// update时的自增.
//--------------------------------------------------------
class sql_inc {
  constructor(n) {
    assert(Number.isInteger(n));
    this.n = n;
  }
};

//--------------------------------------------------------
// 用于字段=v. 不对v进行任何验证.
//--------------------------------------------------------
class sql_origin {
  constructor(v) {
    this.v = v;
  }

  toString() {
    return this.v;
  }
};

class NULL_value {
  constructor() {
  }

  toString() {
    return 'NULL';
  }
};

module.exports = {
  sql_inc,
  sql_origin,
  NULL_value,
}