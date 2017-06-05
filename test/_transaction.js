
var co        = require('co');
var febs      = require('febs');
var tap       = require('tap');
var BigNumber = require('bignumber.js');
var condition = require('..').condition;
var dataType  = require('..').dataType;
var isolationLevel = require('..').isolationLevel;
var database  = require('./database');

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

};
