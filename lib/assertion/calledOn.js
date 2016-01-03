import Assertion from '../assertion.js';

import Called from './called.js';
import Match from './match.js';

var CalledWith = Assertion.define(
	'calledWith',
	[{kind: 'Spy'}, {}],
	function(spy, expectedThisValue){
		Called.assert(spy);
		Match.assert(spy.thisValue, expectedThisValue);
	}
);

export default CalledWith;