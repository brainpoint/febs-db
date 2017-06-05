'use strict';
/**
* Copyright (c) 2017 Copyright citongs All Rights Reserved.
* Author: lipengxiang
*/

const febs = require('febs');
const BigNumber = require('bignumber.js');
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

/**
* @desc: get the value for sql.
*         Date:   get the UTC time.
*         Buffer: 0x... (hex)
* @return: string.
*/
module.exports = (value, type) => {
  if (value == null) {
    return null
  }

  let c_type;
  let c_length = Number.MAX_VALUE;
  let c_precision = 7;
  let c_scale = 2;
  let c_unsigned = false;

  if (typeof type === 'function') {
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
    case 'string':
      if ( 
        (c_type !== TYPES.VarChar &&
        c_type !== TYPES.NVarChar &&
        c_type !== TYPES.Text &&
        c_type !== TYPES.NText &&
        c_type !== TYPES.Char &&
        c_type !== TYPES.NChar)
       )
        throw new exception(`PARAM ${value} type error`, exception.PARAM, __filename, __line);
      
      if (value.length > c_length)
        throw new exception(`PARAM ${value} too large`, exception.PARAM, __filename, __line);

      if (
        (c_type === TYPES.VarChar ||
        c_type === TYPES.Text ||
        c_type === TYPES.Char)
      )
        return escape(value);
      else
        return "N" + escape(value);

    case 'boolean':
       if ( 
        (c_type !== TYPES.Bit)
       )
        throw new exception(`PARAM ${value} type error`, exception.PARAM, __filename, __line);
      
      return value ? '1' : '0'

    case 'number':
      //
      if (c_type === TYPES.BigInt) {
        if (!Number.isInteger(value))
          throw new exception(`PARAM ${value} is not integer`, exception.PARAM, __filename, __line);
        
        if (c_unsigned) {
          console.log('mssql Only support signed bigint');
        }
        
        return value.toString();
      }

      //
      if (c_type === TYPES.TinyInt) {
        if (!Number.isInteger(value))
          throw new exception(`PARAM ${value} is not integer`, exception.PARAM, __filename, __line);
        
        if (!c_unsigned) {
          console.log('mssql Only support unsigned tinyint');
        }
        
        if (value < 0 || value > 255)
          throw new exception(`PARAM ${value} is not in range`, exception.PARAM, __filename, __line);
        
        return value.toString();
      }
      
      //
      if (c_type === TYPES.SmallInt) {
        if (!Number.isInteger(value))
          throw new exception(`PARAM ${value} is not integer`, exception.PARAM, __filename, __line);
        
        if (c_unsigned) {
          console.log('mssql Only support signed smallint');
        }
        
        if (value > 32767 || value < -32768)
          throw new exception(`PARAM ${value} is not in range`, exception.PARAM, __filename, __line);
        
        return value.toString();
      }
      
      //
      if (c_type === TYPES.Int) {
        if (!Number.isInteger(value))
          throw new exception(`PARAM ${value} is not integer`, exception.PARAM, __filename, __line);
        
        if (c_unsigned) {
          console.log('mssql Only support signed int');
        }
        
        if (value > 2147483647 || value < -2147483648)
          throw new exception(`PARAM ${value} is not in range`, exception.PARAM, __filename, __line);
        
        return value.toString();
      }
      
      //
      if (c_type === TYPES.Float) {
        if (c_unsigned) {
          if (value < 0)
            throw new exception(`PARAM ${value} is unsigned`, exception.PARAM, __filename, __line);
        }
          
        return value.toString();
      }
      
      //
      if (c_type === TYPES.Numeric) {
        if (c_unsigned) {
          if (value < 0)
            throw new exception(`PARAM ${value} is unsigned`, exception.PARAM, __filename, __line);
        }
          
        return value.toString();
      }
      
      //
      if (c_type === TYPES.Decimal) {
        if (c_unsigned) {
          if (value < 0)
            throw new exception(`PARAM ${value} is unsigned`, exception.PARAM, __filename, __line);
        }
          
        return value.toString();
      }
      
      //
      if (c_type === TYPES.Real) {
        if (c_unsigned) {
          if (value < 0)
            throw new exception(`PARAM ${value} is unsigned`, exception.PARAM, __filename, __line);
        }
          
        return value.toString();
      }
      
      throw new exception(`PARAM ${value} type error`, exception.PARAM, __filename, __line);
      
    case 'object':
      //
      if (value instanceof Date) {
        if ( 
          (c_type !== TYPES.DateTime)
        )
          throw new exception(`PARAM ${value} type error`, exception.PARAM, __filename, __line);

        return `'${value.getFullYear()}-${zero(value.getMonth() + 1)}-${zero(value.getDate())} ${zero(value.getHours())}:${zero(value.getMinutes())}:${zero(value.getSeconds())}'`
      } 

      // 
      if (value instanceof BigNumber) {
        if ( 
          (c_type !== TYPES.BigInt)
        )
          throw new exception(`PARAM ${value} type error`, exception.PARAM, __filename, __line);

        if (c_unsigned) {
          console.log('mssql Only support signed bigint');
        }

        return febs.utils.bigint_toFixed(value);
      }
      
      //
      else if (Buffer.isBuffer(value)) {
        if ( 
          (c_type !== TYPES.Binary) &&
          (c_type !== TYPES.VarBinary)
        )
          throw new exception(`PARAM ${value} type error`, exception.PARAM, __filename, __line);

        if (value.length > c_length)
          throw new exception(`PARAM ${value} too large`, exception.PARAM, __filename, __line);

        return `0x${value.toString('hex')}`
      }

      throw new exception(`unsupported value type ${value}`, exception.PARAM, __filename, __line);

    default:
      throw new exception(`unsupported value type ${value}`, exception.PARAM, __filename, __line);
  }
}
