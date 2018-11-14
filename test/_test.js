
var co        = require('co');
var tap       = require('tap');

module.exports =  {

  /**
  * @desc: 
  * @return: 
  */
  test(db) {
    let table = db.table1;


    table.add({col10:new Date(), col8:'23243242'}).then(res=>{
    table.select().then(res=>{
      console.log(res[0].col10);
      console.log(res[0].col10.getMilliseconds());
    }).catch(err=>{ 
      console.log(err);
    });
  });
    
    // table.count(null)
    // .then(ret=>{
    //   console.log('[promise count]');
    //   console.log(ret);
    //   console.log('');
    // })
    // .catch(e=>{
    //   console.log(e);
    // })
  },

};
