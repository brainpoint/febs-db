
var co        = require('co');
var tap       = require('tap');

module.exports =  {

  /**
  * @desc: 
  * @return: 
  */
  test(db) {
    let table = db.table1;
    table.exist(250)
    .then(ret=>{
      console.log('[promise exist]');
      console.log(ret);
      console.log('');
    })
    .catch(e=>{
      console.log(e);
    })
  }

};
