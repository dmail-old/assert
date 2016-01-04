import Assertion from '../assertion.js';

var WillTimeout = Assertion.define(
	'willTimeout',
	[{is: 'thenable'}, {type: 'number', default: 10}],
	function(thenable, ms){
		this.timeoutDuration = ms;
		this.timeoutExpected = true; // timeout will pass and not fail
		return thenable;
	}
);

export default WillTimeout;