import Assertion from '../assertion.js';

import Called from './called.js';

var WillBeCalled = Assertion.define(
	'willBeCalled',
	[{kind: 'Spy'}],
	function(spy){
		return spy.then(function(){
			Called.assert(spy);
		});
	}
);

export default WillBeCalled;