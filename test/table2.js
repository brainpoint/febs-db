
var co        = require('co');
var tablebase = require('..').tablebase;
var dataType  = require('..').dataType;

module.exports = class extends tablebase {

	constructor() {
    super('table2', 'id',
    {
      id:     {type: dataType.BigInt(true), key: true}, // the auto-incrementing primary key
      col2:   {type: dataType.VarChar(20)},
      col3:   {type: dataType.Text()},
      col4:   {type: dataType.Char(20)},
    });
	}


};
