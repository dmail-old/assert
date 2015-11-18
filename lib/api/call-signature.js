import proto from 'proto';

import ValidityState from '../validity-state.js';
import register from '../register.js';

import match from '../match.js';

register('thisValue', {
	check(actualThisValue, expectedThisValue){
		if( false === match(actualThisValue, expectedThisValue) ){
			this.fail();
		}
		else{
			this.pass();
		}
	}
});

register('minArgumentLength', {
	check(actualArgLength, expectedArgLength){
		if( actualArgLength < expectedArgLength ){
			this.fail();
		}
		else{
			this.pass();
		}
	}
});

register('maxArgumentLength', {
	check(actualArgLength, expectedArgLength){
		if( actualArgLength > expectedArgLength ){
			this.fail();
		}
		else{
			this.pass();
		}
	}
});

register('argumentMatch', {
	check(actualArgumentValue, expectedArgumentValue){
		if( false === match(actualArgumentValue, expectedArgumentValue) ){
			this.fail();
		}
		else{
			this.pass();
		}
	}
});

var CallSignature = proto.extend({
	expectedThisValue: undefined,
	argumentAssertions: undefined,
	allowRestArguments: undefined,
	meta: undefined, // Meta associate to this signature

	constructor: function CallSignature(method){
		this.method = method;
	},

	assertThis(expectedThisValue){
		this.expectedThisValue = expectedThisValue;
	},

	assertArguments(expectedArguments){
		this.expectedArguments = expectedArguments;
	},

	assertApply(expectedThisValue, expectedArguments){
		this.assertThis(expectedThisValue);
		this.assertArguments(expectedArguments);
	},

	assertCall(expectedThisValue){
		return this.assertApply(expectedThisValue, Array.prototype.slice.call(arguments, 1));
	},

	checkValidity(thisValue, args){
		var validityState = ValidityState.create();

		if( this.hasOwnProperty('expectedThisValue') ){
			var actualThisValue = thisValue;
			var expectedThisValue = this.expectedThisValue;

			validityState.assert('thisValue', actualThisValue, expectedThisValue);
		}
		if( this.hasOwnProperty('expectedArguments') ){
			var actualArgs = args;
			var expectedArguments = this.expectedArguments;
			var actualArgLength = actualArgs.length;
			var expectedArgLength = expectedArguments.length;

			validityState.assert('minArgumentLength', actualArgLength, expectedArgLength);
			if( false === this.allowRestArguments ){
				validityState.assert('maxArgumentLength', actualArgLength, expectedArgLength);
			}

			expectedArguments.forEach(function(expectedArgumentValue, index){
				var actualArgumentValue = args[index];
				validityState.assert('argumentMatch', actualArgumentValue, expectedArgumentValue, index);
			});
		}

		return validityState;
	}
});

export default CallSignature;