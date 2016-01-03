import proto from 'proto';

import Assertion from '../assertion.js';
import Schema from '../node_modules/@dmail/schema/index.js';

var Validate = Assertion.define(
	'validate',
	[{}, Object],
	function(value, definition){
		return Schema.create(definition).validate(value);
	}
);

export default Validate;