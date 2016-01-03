import Assertion from '../assertion.js';

import Returned from './returned.js';
import Match from './match.js';

var ReturnedWith = Assertion.define(
	'returnedWith',
	[{kind: 'Spy'}, {}],
	function(spy, expectedReturnValue){
		Returned.assert(spy);
		Match.assert(spy.returnValue, expectedReturnValue);
	}
);

export default Returned;