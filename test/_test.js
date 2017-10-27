
var co        = require('co');
var tap       = require('tap');

module.exports =  {

  /**
  * @desc: 
  * @return: 
  */
  test(db) {
    let table = db.test;

    // table.add({dt:new Date()}).then(res=>{
    table.select().then(res=>{
      // console.log(res[0].dt);
    }).catch(err=>{ 
      console.log(err); 
    });
  // });
    
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
