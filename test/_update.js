
var co        = require('co');
var tap       = require('tap');


var test_add = {
    id:     250,
    col2:   '987654321',
    col3:   '123456789',
    col4:   '123456789',
    col5:   true,
    col6:   100,
    col7:   3000,
    col8:   655355,
    col9:   5454.451,
    col10:  new Date(),
    col11:  new Buffer('a你好bc'),
    col12:  new Buffer('a你好abc'),
  };

module.exports =  {

  /**
  * @desc: 
  * @return: 
  */
  test(db) {
    let table = db.table1;
    table.update(test_add)
    .then(ret=>{
      console.log('[promise upate]');
      console.log(ret);
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    })
  }

};
