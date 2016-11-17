'use strict';

/**
* Copyright (c) 2015 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

var dbbase   = require('citong-db').table;

module.exports = class extends dbbase {
  constructor(dbclient) {
    super(dbclient, 'tablename', 'id',
    {
      id:               {type: 'integer', size:8, key: true}, // the auto-incrementing primary key
      trade_no:         {type: 'text',    size: 32},
      out_trade_no:     {type: 'text',    size: 64},
    });
  }

  /**
  * @desc: other method.
  */


}
