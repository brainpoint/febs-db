
var co        = require('co');
var tap       = require('tap');

var isolationLevel = require('..').isolationLevel

module.exports =  {

  /**
  * @desc: 
  * @return: 
  */
  test(db) {
    let table = db.table1;


    // table.add({col10:new Date(), col8:'23243242'}).then(res=>{
    // table.select().then(res=>{
    //   console.log(res[0].col10);
    //   console.log(res[0].col10.getMilliseconds());
    // }).catch(err=>{ 
    //   console.log(err);
    // });
    // });

    return db.transaction(isolationLevel.Repeatable_read, async function(db1){
      console.log('')
      console.log('')
      console.log('')
      console.log('')
      console.log('')
      console.log('')
      console.log('')
      
      console.log(await db1.table1.select())

      await db1.CN_CMBAS.add({
        area: 'x',
        city: 'sdfdsfs',
        bms: 111
      })

      console.log('xxx')
      return false;
    })
    .then(res=>{
      console.log('success', res)
    })
    .catch(e=>{
      // console.log(e)
    })

    
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
