import proto from 'proto';

import Assertion from '../assertion.js';
import Schema from '../node_modules/@dmail/schema/index.js';

var Validate = Assertion.define(
	'validate',
	[{}, Object],
	function(value, definition){
		var schema = Schema.create(definition);
		var group = schema.firstGroup(value);

		if( group ){
			throw this.createError(group.createMessage());
		}
	}
);

export default Validate;