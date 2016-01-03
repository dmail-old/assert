import Assertion from '../assertion.js';

import Called from './called.js';
import Match from './match.js';

var CalledWith = Assertion.define(
	'called',
	[{kind: 'Spy'}, {}],
	function(spy, expectedArguments){
		Called.assert(spy);
		Match.assert(spy.args, expectedArguments);
	}
);

export default CalledWith;