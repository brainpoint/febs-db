
var co        = require('co');
var tablebase = require('..').tablebase;
var dataType  = require('..').dataType;

module.exports = class extends tablebase {

	constructor() {
    super('table1', 'id',
    {
      id:     {type: dataType.BigInt(true), key: true}, // the auto-incrementing primary key
      col2:   {type: dataType.VarChar(20)},
      col3:   {type: dataType.Text()},
      col4:   {type: dataType.Char(20)},
      col5:   {type: dataType.Bit()},
      col6:   {type: dataType.TinyInt()},
      col7:   {type: dataType.SmallInt()},
      col8:   {type: dataType.Int()},
      col9:   {type: dataType.Float()},
      col10:   {type: dataType.DateTime()},
      col11:   {type: dataType.Binary(20)},
      col12:   {type: dataType.VarBinary(20)},
    });
	}


};
