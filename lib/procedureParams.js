'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

const febs      = require('febs');
const exception = require('./exception');

module.exports = class {

  constructor() {
    this.params = [];
  }

  /**
  * @desc: 添加in参数.
  * @return: 
  */
  addIn(name, type, value) {
    this.params.push({name, type, value, in:1});
  }

  /**
  * @desc: 添加in参数.
  * @return: 
  */
  addOut(name, type) {
    this.params.push({name, type, in:0});
  }

};