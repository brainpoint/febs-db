
var co        = require('co');
var tap       = require('tap');

var test_add = {
    col2:   '123456789',
    col3:   '123\'456789',
    col4:   '1234\\56789',
    colx:   true,
    col6:   100,
    col7:   3000,
    col8:   655355,
    col9:   5454.451,
    col10:  new Date(),
    col11:  new Buffer('abc你好'),
    col12:  new Buffer('abc你好a'),
  };

module.exports =  {

  /**
  * @desc: add use async.
  * @return: 
  */
  async test_async(db) {
    try {
      let table = db.table1;
      let a = await table.add(test_add);
      console.log('[async add]');
      console.log(test_add.id);
      tap.assert(a === true, 'test async add');
      console.log('');

    } catch(e) {
      tap.error(null, 'async add err');
      console.log(e);
    }
  },

  /**
  * @desc: add use yield.
  * @return: 
  */
  async test_yield(db) {
    let table = db.table1;
    let ctx = table;
    co(function* () {
      try {
        let a = yield ctx.add(test_add)
        console.log('[yield add]');
        console.log(test_add.id);
        tap.assert(a === true, 'test yield add');
        console.log('');

      } catch(e) {
        tap.error(null, 'yield add err');
        console.log(e);
      }
    });
  },

  /**
  * @desc: add use promise.
  * @return: 
  */
  test_promise(db) {
    let table = db.table1;
    table.add(test_add)
    .then(ret=>{
      console.log('[promise add]');
      console.log(test_add.id);
      tap.assert(ret === true, 'test promise add');
      console.log('');
    })
    .catch(e=>{
      tap.error(null, 'promise add err');
      console.log(e);
    })
  }
};
