
var co        = require('co');
var febs      = require('febs');
var tap       = require('tap');
var BigNumber = require('bignumber.js');
var condition = require('..').condition;
var dataType  = require('..').dataType;
var procedureParams = require('..').procedureParams;

module.exports =  {

  /**
  * @desc: 
  * @return: 
  */
  test_condition(db) {

    // bigint.
    {
      console.log('');
      console.log('bigint');
      let check_count = 0;
      let _1 = new condition(db.adapter, { key: {type: dataType.BigInt(true)} });
      tap.assert( _1.equal('key', new BigNumber('12343353342434343')) == ' key=12343353342434343 ' );
      try {
        _1.equal('key', new BigNumber('-12343353342434343'));
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      tap.assert( _1.equal('key', 123456) == ' key=123456 ' );
      tap.assert( _1.more_than('key', new BigNumber('12343353342434343')) == ' key>12343353342434343 ' );
      tap.assert( _1.more_equal('key', new BigNumber('12343353342434343')) == ' key>=12343353342434343 ' );
      tap.assert( _1.less_equal('key', new BigNumber('12343353342434343')) == ' key<=12343353342434343 ' );
      tap.assert( _1.less_than('key', new BigNumber('12343353342434343')) == ' key<12343353342434343 ' );
      tap.assert( _1.not_equal('key', new BigNumber('12343353342434343')) == ' key<>12343353342434343 ' );
      // tap.assert( _1.like('key', new BigNumber('12343353342434343')) == ' key LIKE 12343353342434343 ' );
      tap.assert( _1.between('key', new BigNumber('12343353342434343'), 123) == ' key BETWEEN 12343353342434343 AND 123 ' );
      tap.assert( _1.in('key', [new BigNumber('12343353342434343')]) == ' key IN (12343353342434343) ' );
      tap.assert( _1.not_in('key', [new BigNumber('12343353342434343'), 1234]) == ' key NOT IN (12343353342434343,1234) ' );
      
      if (db.dbType == 'mysql')
        tap.assert( check_count == 1 );
      
      if (db.dbType == 'mssql')
        tap.assert( check_count == 0 );
    }

    // varchar.
    {
      console.log('');
      console.log('varchar');
      let check_count = 0;
      let _1 = new condition(db.adapter, { key: {type: dataType.VarChar(10)} });
      tap.assert( _1.equal('key', '1234567890') == ' key=\'1234567890\' ' );
      if (db.dbType == 'mysql')
        tap.assert( _1.equal('key', '12345\'6789') == ' key=\'12345\\\'6789\' ' );
      if (db.dbType == 'mssql')
        tap.assert( _1.equal('key', '12345\'6789') == ' key=\'12345\'\'6789\' ' );
      try {
      _1.equal('key', '12345678901');
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      tap.assert( _1.more_than('key', '1234567890') == ' key>\'1234567890\' ' );
      tap.assert( _1.more_equal('key', '1234567890') == ' key>=\'1234567890\' ' );
      tap.assert( _1.less_equal('key', '1234567890') == ' key<=\'1234567890\' ' );
      tap.assert( _1.less_than('key', '1234567890') == ' key<\'1234567890\' ' );
      tap.assert( _1.not_equal('key', '1234567890') == ' key<>\'1234567890\' ' );
      tap.assert( _1.like('key', '%1234567890') == ' key LIKE \'%1234567890\' ' );
      tap.assert( _1.between('key', '1234567890', '123') == ' key BETWEEN \'1234567890\' AND \'123\' ' );
      tap.assert( _1.in('key', ['1234567890']) == ' key IN (\'1234567890\') ' );
      tap.assert( _1.not_in('key', ['1234567890', '1234']) == ' key NOT IN (\'1234567890\',\'1234\') ' );
      
      tap.assert( check_count == 1 );
    }

    // text.
    {
      console.log('');
      console.log('text');
      let check_count = 0;
      let _1 = new condition(db.adapter, { key: {type: dataType.Text()} });
      tap.assert( _1.equal('key', '1234567890') == ' key=\'1234567890\' ' );
      if (db.dbType == 'mysql')
        tap.assert( _1.equal('key', '12345\'6789') == ' key=\'12345\\\'6789\' ' );
      if (db.dbType == 'mssql')
        tap.assert( _1.equal('key', '12345\'6789') == ' key=\'12345\'\'6789\' ' );
      tap.assert( _1.more_than('key', '1234567890') == ' key>\'1234567890\' ' );
      tap.assert( _1.more_equal('key', '1234567890') == ' key>=\'1234567890\' ' );
      tap.assert( _1.less_equal('key', '1234567890') == ' key<=\'1234567890\' ' );
      tap.assert( _1.less_than('key', '1234567890') == ' key<\'1234567890\' ' );
      tap.assert( _1.not_equal('key', '1234567890') == ' key<>\'1234567890\' ' );
      tap.assert( _1.like('key', '%1234567890') == ' key LIKE \'%1234567890\' ' );
      tap.assert( _1.between('key', '1234567890', '123') == ' key BETWEEN \'1234567890\' AND \'123\' ' );
      tap.assert( _1.in('key', ['1234567890']) == ' key IN (\'1234567890\') ' );
      tap.assert( _1.not_in('key', ['1234567890', '1234']) == ' key NOT IN (\'1234567890\',\'1234\') ' );
      
      tap.assert( check_count == 0 );
    }

    // char.
    {
      console.log('');
      console.log('char');
      let check_count = 0;
      let _1 = new condition(db.adapter, { key: {type: dataType.Char(10)} });
      try {
      _1.equal('key', '12345678901');
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      tap.assert( _1.equal('key', '1234567890') == ' key=\'1234567890\' ' );
      if (db.dbType == 'mysql')
        tap.assert( _1.equal('key', '12345\'6789') == ' key=\'12345\\\'6789\' ' );
      if (db.dbType == 'mssql')
        tap.assert( _1.equal('key', '12345\'6789') == ' key=\'12345\'\'6789\' ' );
      tap.assert( _1.more_than('key', '1234567890') == ' key>\'1234567890\' ' );
      tap.assert( _1.more_equal('key', '1234567890') == ' key>=\'1234567890\' ' );
      tap.assert( _1.less_equal('key', '1234567890') == ' key<=\'1234567890\' ' );
      tap.assert( _1.less_than('key', '1234567890') == ' key<\'1234567890\' ' );
      tap.assert( _1.not_equal('key', '1234567890') == ' key<>\'1234567890\' ' );
      tap.assert( _1.like('key', '%1234567890') == ' key LIKE \'%1234567890\' ' );
      tap.assert( _1.between('key', '1234567890', '123') == ' key BETWEEN \'1234567890\' AND \'123\' ' );
      tap.assert( _1.in('key', ['1234567890']) == ' key IN (\'1234567890\') ' );
      tap.assert( _1.not_in('key', ['1234567890', '1234']) == ' key NOT IN (\'1234567890\',\'1234\') ' );
      
      tap.assert( check_count == 1 );
    }

    // bit.
    {
      console.log('');
      console.log('bit');
      let check_count = 0;
      let _1 = new condition(db.adapter, { key: {type: dataType.Bit()} });
      try {
      _1.equal('key', '12345678901');
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      tap.assert( _1.equal('key', true) == ' key=1 ' );
      tap.assert( _1.not_equal('key', true) == ' key<>1 ' );
      tap.assert( _1.in('key', [true, false]) == ' key IN (1,0) ' );
      tap.assert( _1.not_in('key', [true, false]) == ' key NOT IN (1,0) ' );
      
      tap.assert( check_count == 1 );
    }

    // tinyint.
    {
      console.log('');
      console.log('tinyint');
      let check_count = 0;
      let _1 = new condition(db.adapter, { key: {type: dataType.TinyInt(true)} });
      tap.assert( _1.equal('key', 123) == ' key=123 ' );
      try {
        _1.equal('key', -123);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      try {
        _1.equal('key', 256);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      try {
        _1.equal('key', 300);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      tap.assert( _1.more_than('key', 123) == ' key>123 ' );
      tap.assert( _1.more_equal('key', 123) == ' key>=123 ' );
      tap.assert( _1.less_equal('key', 123) == ' key<=123 ' );
      tap.assert( _1.less_than('key', 123) == ' key<123 ' );
      tap.assert( _1.not_equal('key', 123) == ' key<>123 ' );
      tap.assert( _1.between('key', 100, 123) == ' key BETWEEN 100 AND 123 ' );
      tap.assert( _1.in('key', [123]) == ' key IN (123) ' );
      tap.assert( _1.not_in('key', [123, 100]) == ' key NOT IN (123,100) ' );

      _1 = new condition(db.adapter, { key: {type: dataType.TinyInt(false)} });
      tap.assert( _1.equal('key', 123) == ' key=123 ' );
      if (db.dbType == 'mysql')
        tap.assert( _1.equal('key', -123) == ' key=-123 ' );
      try {
        _1.equal('key', -129);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      try {
        _1.equal('key', 128);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      
      if (db.dbType == 'mysql')
        tap.assert( check_count == 5 );
      if (db.dbType == 'mssql')
        tap.assert( check_count == 3 );
    }

    // smallint.
    {
      console.log('');
      console.log('smallint');
      let check_count = 0;
      let _1 = new condition(db.adapter, { key: {type: dataType.SmallInt(true)} });
      tap.assert( _1.equal('key', 123) == ' key=123 ' );
      try {
        _1.equal('key', -123);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      try {
        _1.equal('key', 65536);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      try {
        _1.equal('key', 655361);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      tap.assert( _1.more_than('key', 123) == ' key>123 ' );
      tap.assert( _1.more_equal('key', 123) == ' key>=123 ' );
      tap.assert( _1.less_equal('key', 123) == ' key<=123 ' );
      tap.assert( _1.less_than('key', 123) == ' key<123 ' );
      tap.assert( _1.not_equal('key', 123) == ' key<>123 ' );
      tap.assert( _1.between('key', 100, 123) == ' key BETWEEN 100 AND 123 ' );
      tap.assert( _1.in('key', [123]) == ' key IN (123) ' );
      tap.assert( _1.not_in('key', [123, 100]) == ' key NOT IN (123,100) ' );

      _1 = new condition(db.adapter, { key: {type: dataType.SmallInt(false)} });
      tap.assert( _1.equal('key', 123) == ' key=123 ' );
      tap.assert( _1.equal('key', -123) == ' key=-123 ' );
      try {
        _1.equal('key', -32769);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      try {
        _1.equal('key', 32768);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      
      if (db.dbType == 'mysql')
        tap.assert( check_count == 5 );

      if (db.dbType == 'mssql')
        tap.assert( check_count == 3 );
    }

    // int.
    {
      console.log('');
      console.log('int');
      let check_count = 0;
      let _1 = new condition(db.adapter, { key: {type: dataType.Int(true)} });
      tap.assert( _1.equal('key', 123) == ' key=123 ' );
      try {
        _1.equal('key', -123);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      try {
        _1.equal('key', Math.pow(2, 32)+1);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      tap.assert( _1.more_than('key', 123) == ' key>123 ' );
      tap.assert( _1.more_equal('key', 123) == ' key>=123 ' );
      tap.assert( _1.less_equal('key', 123) == ' key<=123 ' );
      tap.assert( _1.less_than('key', 123) == ' key<123 ' );
      tap.assert( _1.not_equal('key', 123) == ' key<>123 ' );
      tap.assert( _1.between('key', 100, 123) == ' key BETWEEN 100 AND 123 ' );
      tap.assert( _1.in('key', [123]) == ' key IN (123) ' );
      tap.assert( _1.not_in('key', [123, 100]) == ' key NOT IN (123,100) ' );

      _1 = new condition(db.adapter, { key: {type: dataType.Int(false)} });
      tap.assert( _1.equal('key', 123) == ' key=123 ' );
      tap.assert( _1.equal('key', -123) == ' key=-123 ' );
      try {
        _1.equal('key', -Math.pow(2, 31)-1);
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      try {
        _1.equal('key', Math.pow(2, 31));
      } catch (e) { if (e.code == febs.exception.PARAM) { tap.pass('[err value check ok]'); check_count++; } }
      
      if (db.dbType == 'mysql')
        tap.assert( check_count == 4 );

      if (db.dbType == 'mssql')
        tap.assert( check_count == 3 );
    }


    // float.
    {
      console.log('');
      console.log('float');
      let check_count = 0;
      let _1 = new condition(db.adapter, { key: {type: dataType.Float()} });
      tap.assert( _1.equal('key', 123.23434) == ' key=123.23434 ' );
      tap.assert( _1.more_than('key', 123.23434) == ' key>123.23434 ' );
      tap.assert( _1.more_equal('key', 123.23434) == ' key>=123.23434 ' );
      tap.assert( _1.less_equal('key', 123.23434) == ' key<=123.23434 ' );
      tap.assert( _1.less_than('key', 123.23434) == ' key<123.23434 ' );
      tap.assert( _1.not_equal('key', 123.23434) == ' key<>123.23434 ' );
      tap.assert( _1.between('key', 123.23434, 123) == ' key BETWEEN 123.23434 AND 123 ' );
      tap.assert( _1.in('key', [123]) == ' key IN (123) ' );
      tap.assert( _1.not_in('key', [123, 100]) == ' key NOT IN (123,100) ' );

      tap.assert( check_count == 0 );
    }


  },

  /**
  * @desc: query use promise.
  * @return: 
  */
  test(db) {
    let table = db.table1;
    let where = table.condition.more_than('id', 1);
    table.select(where, {
      limit:   2, 
      orderby: {id:false, col2:true}
    })
    .then(ret=>{
      console.log('[promise query]');
      console.log(ret);
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    })
  },

  /**
  * @desc: query procedure use promise.
  * 查询如下存储过程:
  *
    CREATE PROCEDURE procedure2(out min int, out avg int, in userid int)
    BEGIN
      select count(id) INTO min from table1;
      select count(id) INTO avg from table1 where id=userid;
      select min, avg;
    END
  * @return: 
  */
  testProcedure(db) {
    // make param.
    var params = new procedureParams();
    params.addOut('min1', dataType.Int());
    params.addOut('avg1', dataType.Int());
    params.addIn('userid1', dataType.Int(), 2);

    // exec.
    db.execProcedure('procedure2', params)
    .then(ret=>{
      console.log('[promise procedure]');
      console.log(ret);
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    })
  },



};
