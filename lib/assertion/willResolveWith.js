import Assertion from '../assertion.js';

import Match from './match.js';

var WillResolveWith = Assertion.define(
	'willResolveWith',
	[{is: 'thenable'}, {}],
	function test(thenable, expectedResolutionValue){
		return thenable.then(
			function(resolutionValue){
				return Match.assert(resolutionValue, expectedResolutionValue);
			}
		);
	}
);

export default WillResolveWith;