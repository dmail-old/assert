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

WillResolveWith.messages.match = "thenable has resolved but {message}"; // message is the message from Match error

export default WillResolveWith;