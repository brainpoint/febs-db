
var co        = require('co');
var tablebase = require('../lib').tablebase;
var dataType  = require('../lib').dataType;

module.exports = class extends tablebase {

	constructor() {
    super('CN_CMBAS', 'id',
    {
      id: { type: dataType.NVarChar(255)},
      area: { type: dataType.NVarChar(255) },
      city: { type: dataType.NVarChar(255) },
      am: { type: dataType.NVarChar(255) },
      cm: { type: dataType.NVarChar(255) },
      bms: { type: dataType.NVarChar(255) },
      sm: { type: dataType.NVarChar(255) },
      tr: { type: dataType.NVarChar(255) },
      counter: { type: dataType.NVarChar(255) }
    });
	}


};
