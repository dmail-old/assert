import Assertion from '../assertion.js';

var willReject = Assertion.define(
	'willReject',
	[{is: 'thenable'}],
	function(thenable){
		this.expectState('REJECTED');
		return thenable;
	}
);

export default willReject;