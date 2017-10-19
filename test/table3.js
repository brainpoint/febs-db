
var co        = require('co');
var tablebase = require('../lib').tablebase;
var dataType  = require('../lib').dataType;

module.exports = class extends tablebase {

	constructor() {
    super('test', 'id',
    {
      id:     {type: dataType.BigInt(true), key: true}, // the auto-incrementing primary key
      dt:     {type: dataType.DateTime()},
    });
	}


};
