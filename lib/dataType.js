'use strict';
/**
* Copyright (c) 2016 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/


/**
* @desc: 目前支持的数据类型如下. 
*/
const TYPES = {

  /**
  * @desc: 获得参数的类型.(不考虑长度等其他选项)
  */
  getType   (value)                               { if (typeof value === 'function') return value; return value.type; },

  /**
  * @desc: 判断类型是否为整型. 
  */
  isIntegerType (value)                           { let type = this.getType(value); return type === this.BigInt || type === this.TinyInt || type === this.SmallInt || type === this.Int; },

  /**
  * @desc: 判断类型是否为字符串. 
  */
  isStringType (value)                           { let type = this.getType(value); return type === this.VarChar || type === this.NVarChar || type === this.Text || type === this.NText || type === this.Char || type === this.NChar; },

  /**
  * @desc: use string. 
  */
  VarChar   (length = Number.MAX_SAFE_INTEGER)             { return {type: TYPES.VarChar, length} },
  NVarChar  (length = Number.MAX_SAFE_INTEGER)             { return {type: TYPES.NVarChar, length} },
  Text      ()                                             { return {type: TYPES.Text} },
  NText     ()                                             { return {type: TYPES.NText} },
  Char      (length = Number.MAX_SAFE_INTEGER)             { return {type: TYPES.Char, length} },
  NChar     (length = Number.MAX_SAFE_INTEGER)             { return {type: TYPES.NChar, length} },
  
  /**
  * @desc: use boolean. 
  */
  Bit       ()                                           { return {type: TYPES.Bit} },

  /**
  * @desc:  use number or BigNumber (BigNumber.js)
  */
  BigInt    (unsigned = false)                           { return {type: TYPES.BigInt, unsigned} },

  /**
  * @desc: use number. 
  */
  TinyInt   (unsigned = false)                           { return {type: TYPES.TinyInt, unsigned} },
  SmallInt  (unsigned = false)                           { return {type: TYPES.SmallInt, unsigned} },
  Int       (unsigned = false)                           { return {type: TYPES.Int, unsigned} },
  Float     (unsigned = false)                           { return {type: TYPES.Float, unsigned} },
  Numeric   (unsigned = false, precision = 7, scale = 2) { return {type: TYPES.Numeric, precision, scale, unsigned} },
  Decimal   (unsigned = false, precision = 7, scale = 2) { return {type: TYPES.Decimal, precision, scale, unsigned} },
  Real      (unsigned = false)                           { return {type: TYPES.Real, unsigned} },

  /**
  * @desc: use Date.
  *   mssql:   smalldatetime  (YYYY-MM-DD hh:mm:ss)
  *   mysql:   datetime       (YYYY-MM-DD hh:mm:ss)
  */
  DateTime  ()                                          { return {type: TYPES.DateTime} },

  /**
  * @desc: use Buffer. 
  */
  Binary    (length = Number.MAX_SAFE_INTEGER)          { return {type: TYPES.Binary, length} },
  VarBinary (length = Number.MAX_SAFE_INTEGER)          { return {type: TYPES.VarBinary, length} },
}


module.exports = TYPES;