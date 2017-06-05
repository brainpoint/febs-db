
var co        = require('co');
var tap       = require('tap');

module.exports =  {

  /**
  * @desc: 
  * @return: 
  */
  test(db) {
    let table = db.table1;

    table.count(null)
    .then(ret=>{
      console.log('[promise count]');
      console.log(ret);
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    })
  },


  /**
  * @desc: 
  * @return: 
  */
  testWhere(db) {
    let table = db.table1;
    let where = table.condition.more_than('id', 1);
    table.count(where)
    .then(ret=>{
      console.log('');
      console.log('[promise count]');
      console.log(ret);
    })
    .catch(e=>{
      console.log(e);
    })
  }

};
