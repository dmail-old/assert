import Assertion from '../assertion.js';

import Threw from './threw.js';
import Match from './match.js';

var Threw = Assertion.define(
	'threwWith',
	[{kind: 'Spy'}],
	function(spy, expectedErrorValue){
		Threw.assert(spy);
		Match.assert(spy.errorValue, expectedErrorValue);
	}
);

export default Threw;