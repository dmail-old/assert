import Assertion from '../assertion.js';

import Match from './match.js';

var WillResolveWith = Assertion.define(
	'willResolveWith',
	[{is: 'thenable'}, {}],
	function test(thenable, expectedResolutionValue){
		return thenable.then(function(resolutionValue){
			return Match.assert(resolutionValue, expectedResolutionValue);
		});
	}
	/*
	{
		messages: {
			"self": "thenable has resolved but {message}", // this.result.message;
			"onReject": "thenable has rejected with {result} while expecting to resolve with {expected}"
		}
	}
	*/
);

export default WillResolveWith;