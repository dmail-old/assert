import Assertion from '../assertion.js';

import Called from './called.js';

var Threw = Assertion.define(
	'threw',
	[{kind: 'Spy'}],
	function(spy){
		Called.assert(spy);
		if( false === spy.errored ){
			throw this.createError("spy did not throw");
		}
	}
);

export default Threw;