import Assertion from '../assertion.js';

var WillBePending = Assertion.define(
	'willBePending',
	[{is: 'thenable'}, {type: 'number', default: 10}],
	function(thenable, ms){
		this.timeoutDuration = ms;
		this.expectState('TIMEDOUT');
		return thenable;
	}
);

export default WillBePending;