
var co        = require('co');
var tap       = require('tap');

module.exports =  {

  /**
  * @desc: 
  * @return: 
  */
  test(db) {
    let table = db.table1;

    table.add({col10:new Date(2018,1,1,1), col8:'23243242'}).then(res=>{
    table.select().then(res=>{
      // console.log(res[0].dt);
      console.log(res);
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
