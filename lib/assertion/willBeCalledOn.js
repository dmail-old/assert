import Assertion from '../assertion.js';

var willBeCalledOn = Assertion.define(
	'willbeCalledOn',
	[{kind: 'spy'}, {}],
	function(spy, expectedThisValue){
		// je dois m'assurer que spy va se résoudre
		// je dois m'assurer que spy.thisValue match expectedThisValue


		return spy;
	}
);

export default willBeCalledOn;