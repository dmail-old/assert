import proto from 'proto';

import ValidityState from '../validity-state.js';
import register from '../register.js';

import Assertion from '../assertion.js';
import MatchAssertion from '../match.js';

import AssertionFactory from '../assertion-factory.js';

var AboveAssertion = Assertion.extend({
	type: 'above',

	get minValue(){
		return this.args[1];
	},

	check(actualValue, expectedMinValue){
		if( actualValue < expectedMinValue ){
			this.fail();
		}
		else{
			this.pass();
		}
	}
});

var BelowAssertion = Assertion.extend({
	type: 'below',

	get maxValue(){
		return this.args[1];
	},

	check(actualValue, expectedMaxValue){
		if( actualValue > expectedMaxValue ){
			this.fail();
		}
		else{
			this.pass();
		}
	}
});

var ThisMatchAssertion = MatchAssertion.extend({
	type: 'thisMatch'
});

var ArgumentLengthIsAboveAssertion = AboveAssertion.extend({
	type: 'argumentLengthAbove'
});

var ArgumentLengthIsBelowAssertion = BelowAssertion.extend({
	type: 'argumentLengthBelow'
});

var ArgumentMatchAssertion = MatchAssertion.extend({
	type: 'argumentMatch',

	get index(){
		return this.args[2];
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
		if( this.hasOwnProperty('expectedThisValue') ){
			var actualThisValue = thisValue;
			var expectedThisValue = this.expectedThisValue;

			ThisMatchAssertion.create(actualThisValue, expectedThisValue);
		}
		if( this.hasOwnProperty('expectedArguments') ){
			var actualArgs = args;
			var expectedArguments = this.expectedArguments;
			var actualArgLength = actualArgs.length;
			var expectedArgLength = expectedArguments.length;

			ArgumentLengthIsAboveAssertion.create(actualArgLength, expectedArgLength);
			if( false === this.allowRestArguments ){
				ArgumentLengthIsBelowAssertion.create(actualArgLength, expectedArgLength);
			}

			expectedArguments.find(function(expectedArgumentValue, index){
				var actualArgumentValue = args[index];

				ArgumentMatchAssertion.create(actualArgumentValue, expectedArgumentValue, index);
			});
		}
	}
});

export default CallSignature;