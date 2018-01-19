'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

const febs     = require('febs');
const assert   = require('assert');
const JOIN     = require('./join');

module.exports = class extends JOIN {
  constructor(table1, alias1, table2, alias2, on) {
    this.table1 = table1;
    this.table2 = table2;
    this.alias1 = alias1;
    this.alias2 = alias2;
    this.on = on;
  }

  /**
  * @desc: 获得from sql
  * @return: 
  */
  get sql_from() {
    return `FROM ${this.table1.tablename}${this.alias1?' AS ' +this.alias1:''} INNER JOIN ${this.table2.tablename}${this.alias2?' AS ' +this.alias2:''} `; 
  }

  /**
  * @desc: 获得on sql
  * @return: 
  */
  get sql_on() {
    return this.on;
  }
  
};