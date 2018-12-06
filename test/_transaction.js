
var co        = require('co');
var febs      = require('febs');
var tap       = require('tap');
var BigNumber = require('febs').BigNumber;
var condition = require('../lib').condition;
var dataType  = require('../lib').dataType;
var isolationLevel = require('../lib').isolationLevel;
var database  = require('./database');
var colors = require('colors');

var test_add = {
    col2:   '123456789',
    col3:   '123\'456789',
    col4:   '123456789',
    col5:   true,
    col6:   100,
    col7:   3000,
    col8:   655355,
    col9:   5454.451,
    col10:  new Date(),
    col11:  new Buffer('abc你好'),
    col12:  new Buffer('abc你好a'),
  };

var test_add2 = {
    col2:   '123456789',
    col3:   '123\'456789',
    col4:   '123456789',
  };
  
module.exports =  {

  /**
  * @desc: query use promise.
  * @return: 
  */
  test(dbsrc) {

    // trans1.
    dbsrc.transaction(isolationLevel.Repeatable_read, async function(db1){
      tap.assert(db1 !== dbsrc);

      // 第一次的事务.
      let table1 = db1.table1;
      let table2 = db1.table2;

      let r1 = true;
      r1 = r1 && await table1.add(test_add);
      r1 = r1 && await table2.add(test_add2);

      let ret = await table1.select(null, {limit:1});
      if (ret && ret.length > 0) {
        ret = await table1.selectLockRow(ret[0].id);
      }

      // 递归一个事务.
      if (r1) {
        let r2 = await db1.transaction(null, async function(db2){
          return await db2.table2.add(test_add2);
        });
        if (!r2)
          return false;

        return true;
      }

    })
    .then(res=>{
      console.log(`[promise transaction] is ${res?'commit':'rollback'}`);
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    });
  },


  /**
  * @desc: query use promise.
  * @return: 
  */
  test_Repeatable_read_and_lock(dbsrc) {

    console.log('');
    console.log('-- test_Repeatable_read_and_lock --');

    // trans1.
    dbsrc.transaction(isolationLevel.Repeatable_read, async function(db1){
      console.log('trans1 begin');
      console.log('    trans1.table1.select()...');
      let ret = await db1.table1.select('id=100');
      console.log('    trans1.table1.select() ok;');

      ret[0].col2 = 'sdfdf';
      console.log('    trans1.table1.update()...');
      await db1.table1.update(ret[0]);
      console.log('    trans1.table1.update() ok;');

      console.log('    trans1 sleep...');
      await febs.utils.sleep(2000);
      console.log('    trans1 wakeup');

      console.log('    trans1.table2.select()...');
      await db1.table2.select();
      console.log('    trans1.table2.select() ok;');
      return true;
    })
    .then(res=>{
      console.log('trans1 ok;');
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    });


    // trans2.
    dbsrc.transaction(isolationLevel.Repeatable_read, async function(db1){
      console.log('trans2 begin'.green);
      console.log('    trans2.table1.select()...'.green);
      let ret = await db1.table1.select('id<=100');
      console.log('    trans2.table1.select() ok;'.green);

      console.log('    trans2 sleep...'.green);
      await febs.utils.sleep(2000);
      console.log('    trans2 wakeup'.green);

      console.log('    trans2.table2.select()...'.green);
      await db1.table2.select();
      console.log('    trans2.table2.select() ok;'.green);
      return true;
    })
    .then(res=>{
      console.log('trans2 ok;'.green);
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    });
  },


  /**
  * @desc: query use promise.
  * @return: 
  */
  test_Serializable(dbsrc) {

    console.log('');
    console.log('-- test_Serializable --');

    // trans1.
    dbsrc.transaction(isolationLevel.Serializable, async function(db1){
      console.log('trans1 begin');
      console.log('    trans1.table1.select()...');
      let ret = await db1.table1.select('id<100');
      console.log('    trans1.table1.select() ok;');

      console.log('    trans1 sleep...');
      await febs.utils.sleep(2000);
      console.log('    trans1 wakeup');

      console.log('    trans1.table2.select()...');
      await db1.table2.select();
      console.log('    trans1.table2.select() ok;');
      return true;
    })
    .then(res=>{
      console.log('trans1 ok;');
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    });


    // trans2.
    dbsrc.transaction(isolationLevel.Read_committed, async function(db1){
      console.log('trans2 begin'.green);
      console.log('    trans2.table1.select()...'.green);
      let ret = await db1.table1.select('id<100');
      console.log('    trans2.table1.select() ok;'.green);

      console.log('    trans2 sleep...'.green);
      await febs.utils.sleep(2000);
      console.log('    trans2 wakeup'.green);

      console.log('    trans2.table2.select()...'.green);
      await db1.table2.select();
      console.log('    trans2.table2.select() ok;'.green);
      return true;
    })
    .then(res=>{
      console.log('trans2 ok;'.green);
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    });
  },

};
