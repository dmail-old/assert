import Assertion from '../assertion.js';

import Called from './called.js';

var Returned = Assertion.define(
	'returned',
	[{kind: 'Spy'}],
	function(spy){
		Called.assert(spy);
		if( spy.errored ){
			throw this.createError("spy encountered an error");
		}
	}
);

export default Returned;