'use strict';
/**
* Copyright (c) 2017 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

const febs = require('febs');
const BigNumber = require('febs').BigNumber;
const exception = require('../exception');
const TYPES = require('../dataType');

const escape = function(sql) {
  sql = sql.replace(/'/g, '\'\'');
  return `'${sql}'`;
}

const zero = function (value, length) {
  if (length == null) length = 2

  value = String(value)
  if (value.length < length) {
    for (let i = 1; i <= length - value.length; i++) {
      value = `0${value}`
    }
  }
  return value
}

const numberCast = function(value, c_type, c_unsigned) {
  //
  if (c_type === 'TYPES.BigInt') {
    if (Number.isInteger(value))
    {
      if (c_unsigned) {
        if (value < 0)
          throw new exception(`PARAM ${colName} is unsigned ,in VALUE ${value}`, exception.PARAM, __filename, __line);
      }
      
      return value.toString();
    }

    // bigint.
    if (febs.utils.bigint_check(value)) {
      if (c_unsigned) {
        if (febs.utils.bigint_less_than(value, 0))
          throw new exception(`PARAM ${colName} is unsigned ,in VALUE ${value}`, exception.PARAM, __filename, __line);
      }

      return febs.utils.bigint_toFixed(value);
    }

    throw new exception(`PARAM ${colName} is not integer ,in VALUE ${value}`, exception.PARAM, __filename, __line);
  }

  //
  if (c_type === 'TYPES.TinyInt') {
    let tValue = Number(value);
    if (!Number.isInteger(tValue))
      throw new exception(`PARAM ${colName} is not integer , in VALUE ${value}`, exception.PARAM, __filename, __line);
    
    if (!c_unsigned) {
      console.debug('mssql Only support unsigned tinyint');
    }
    
    if (tValue < 0 || tValue > 255)
      throw new exception(`PARAM ${colName} is not in range , in VALUE ${value}`, exception.PARAM, __filename, __line);
    
    return value.toString();
  }
  
  //
  if (c_type === 'TYPES.SmallInt') {
    let tValue = Number(value);
    if (!Number.isInteger(tValue))
      throw new exception(`PARAM ${colName} is not integer , in VALUE ${value}`, exception.PARAM, __filename, __line);
    
    if (c_unsigned) {
      console.debug('mssql Only support signed smallint');
    }
    
    if (tValue > 32767 || tValue < -32768)
      throw new exception(`PARAM ${colName} is not in range , in VALUE ${value}`, exception.PARAM, __filename, __line);
    
    return value.toString();
  }
  
  //
  if (c_type === 'TYPES.Int') {
    let tValue = Number(value);
    if (!Number.isInteger(tValue))
      throw new exception(`PARAM ${colName} is not integer , in VALUE ${value}`, exception.PARAM, __filename, __line);
    
    if (c_unsigned) {
      console.debug('mssql Only support signed int');
    }
    
    if (tValue > 2147483647 || tValue < -2147483648)
      throw new exception(`PARAM ${colName} is not in range , in VALUE ${value}`, exception.PARAM, __filename, __line);
    
    return value.toString();
  }
  
  //
  if (c_type === 'TYPES.Float') {
    let tValue = Number(value);
    if (c_unsigned) {
      if (tValue < 0)
        throw new exception(`PARAM ${colName} is unsigned , in VALUE ${value}`, exception.PARAM, __filename, __line);
    }
      
    return value.toString();
  }
  
  //
  if (c_type === 'TYPES.Numeric') {
    let tValue = Number(value);
    if (c_unsigned) {
      if (tValue < 0)
        throw new exception(`PARAM ${colName} is unsigned , in VALUE ${value}`, exception.PARAM, __filename, __line);
    }
      
    return value.toString();
  }
  
  //
  if (c_type === 'TYPES.Decimal') {
    let tValue = Number(value);
    if (c_unsigned) {
      if (tValue < 0)
        throw new exception(`PARAM ${colName} is unsigned , in VALUE ${value}`, exception.PARAM, __filename, __line);
    }
      
    return value.toString();
  }
  
  //
  if (c_type === 'TYPES.Real') {
    let tValue = Number(value);
    if (c_unsigned) {
      if (tValue < 0)
        throw new exception(`PARAM ${colName} is unsigned , in VALUE ${value}`, exception.PARAM, __filename, __line);
    }
      
    return value.toString();
  }
}

/**
* @desc: get the value for sql.
*         Date:   get the UTC time.
*         Buffer: 0x... (hex)
* @return: string.
*/
module.exports = (value, type, colName=null) => {
  if (value == null) {
    return null
  }

  colName = colName || '';
  let c_type;
  let c_length = Number.MAX_VALUE;
  let c_precision = 7;
  let c_scale = 2;
  let c_unsigned = false;

  if (typeof type === 'string') {
    c_type = type;
  } else {
    c_type = type.type;
    c_length = type.length||c_length;
    c_precision = type.precision||c_precision;
    c_scale = type.scale||c_scale;
    c_unsigned = type.unsigned;
  }

  if (febs.utils.isNull(value))
    return 'NULL';
      
  switch (typeof value) {
    case 'string': {
      let rr = numberCast(value, c_type, c_unsigned);
      if (rr) {
        return rr;
      }

      if ( 
        (c_type !== 'TYPES.VarChar' &&
        c_type !== 'TYPES.NVarChar' &&
        c_type !== 'TYPES.Text' &&
        c_type !== 'TYPES.NText' &&
        c_type !== 'TYPES.Char' &&
        c_type !== 'TYPES.NChar')
       )
        throw new exception(`PARAM ${colName} type error , in VALUE ${value}`, exception.PARAM, __filename, __line);
      
      if (value.length > c_length)
        throw new exception(`PARAM ${colName} too large , in VALUE ${value}`, exception.PARAM, __filename, __line);

      if (
        (c_type === 'TYPES.VarChar' ||
        c_type === 'TYPES.Text' ||
        c_type === 'TYPES.Char')
      )
        return escape(value);
      else
        return "N" + escape(value);
    } break;
    case 'boolean':
       if ( 
        (c_type !== 'TYPES.Bit')
       )
        throw new exception(`PARAM ${colName} type error , in VALUE ${value}`, exception.PARAM, __filename, __line);
      
      return value ? '1' : '0'

    case 'number': {
      let rr = numberCast(value, c_type, c_unsigned);
      if (rr) {
        return rr;
      }
      throw new exception(`PARAM ${colName} type error , in VALUE ${value}`, exception.PARAM, __filename, __line);
    } break;
    case 'object':
      //
      if (value instanceof Date) {
        if ( 
          (c_type !== 'TYPES.DateTime')
        )
          throw new exception(`PARAM ${colName} type error , in VALUE ${value}`, exception.PARAM, __filename, __line);

        return `'${value.getUTCFullYear()}-${zero(value.getUTCMonth() + 1)}-${zero(value.getUTCDate())} ${zero(value.getUTCHours())}:${zero(value.getUTCMinutes())}:${zero(value.getUTCSeconds())}.${zero(value.getUTCMilliseconds(), 3)}'`
      } 

      // 
      if (value instanceof BigNumber) {
        if ( 
          (c_type !== 'TYPES.BigInt')
        )
          throw new exception(`PARAM ${colName} type error , in VALUE ${value}`, exception.PARAM, __filename, __line);

        if (c_unsigned) {
          console.debug('mssql Only support signed bigint');
        }

        return febs.utils.bigint_toFixed(value);
      }
      
      //
      else if (Buffer.isBuffer(value)) {
        if ( 
          (c_type !== 'TYPES.Binary') &&
          (c_type !== 'TYPES.VarBinary')
        )
          throw new exception(`PARAM ${colName} type error , in VALUE ${value}`, exception.PARAM, __filename, __line);

        if (value.length > c_length)
          throw new exception(`PARAM ${colName} too large , in VALUE ${value}`, exception.PARAM, __filename, __line);

        return `0x${value.toString('hex')}`
      }

      throw new exception(`unsupported value type ${colName} , in VALUE ${value}`, exception.PARAM, __filename, __line);

    default:
      throw new exception(`unsupported value type ${colName} , in VALUE ${value}`, exception.PARAM, __filename, __line);
  }
}
