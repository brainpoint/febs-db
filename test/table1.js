
var co        = require('co');
var tablebase = require('../lib').tablebase;
var dataType  = require('../lib').dataType;

module.exports = class extends tablebase {

	constructor() {
    super('table1', 'id1',
    {
      id1:     {type: dataType.BigInt(true), key: true, map:'id'}, // the auto-incrementing primary key
      col2:   {type: dataType.VarChar(20),  map: 'a'},
      colx:   {type: dataType.Bit(),        map: 'b'},
      col3:   {type: dataType.Text(),       map: 'c'},
      col4:   {type: dataType.Char(20),     map: 'd'},
      col6:   {type: dataType.TinyInt(),    map: 'e'},
      col7:   {type: dataType.SmallInt(),   map: 'f'},
      col8:   {type: dataType.Int(),        map: 'g'},
      col9:   {type: dataType.Float(),      map: 'h'},
      col10:   {type: dataType.DateTime(),  map: 'i'},
      col11:   {type: dataType.Binary(20),  map: 'j'},
      col12:   {type: dataType.VarBinary(20), map: 'k'},
    });
	}


};
