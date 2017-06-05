
var co        = require('co');
var tap       = require('tap');

module.exports =  {

  /**
  * @desc: remove use promise.
  * @return: 
  */
  test(db) {
    let table = db.table1;
    let where = table.condition.equal('id', 3);
    table.remove(where)
    .then(ret=>{
      console.log('[promise remove]');
      console.log(ret);
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    })
  }

};
