import Assertion from '../assertion.js';

var Called = Assertion.define(
	'called',
	[{kind: 'Spy'}],
	function(spy){
		if( !spy.called ){
			throw this.createError("spy was not called");
		}
	}
);

export default Called;