/*
	I will not collect differences, if a property does not match I'll just log this one
*/

import proto from 'proto';

import Assertion from './assertion.js';
import Schema from '';

var assert;

var ResolveWithAssertion = Assertion.define('resolveWith', {
	schema: [
		{is: 'thenable'}, // Thenable
		undefined // anything
	],

	check(thenable, expectedResolutionValue){
		return thenable.then(function(resolutionValue){
			assert('match', resolutionValue, expectedResolutionValue);
		});
	},

	createMessage(thenable, expectedResolutionValue){
		var failedAssertion = this.failedAssertion;
		var message;

		if( failedAssertion.type === 'match' ){
			message = 'thenable has resolved but ' + failedAssertion.message;
		}
		else if( this.errored ){
			message = 'thenable has rejected with ' + this.result + ' while expecting to resolve with ' + expectedResolutionValue;
		}
		else{
			message = failedAssertion.message;
		}

		return message;
	}
});

var ResolveInAssertion = Assertion.define('resolveIn', {
	schema: [
		{is: 'thenable'},
		{type: 'number', default: 10},
		{type: 'number', default(thenable, expectedDuration){ return expectedDuration * 0.3 + 5; }}
	],

	check(thenable, expectedDuration, acceptableDifference){
		this.timeoutDuration = expectedDuration + acceptableDifference + expectedDuration * 0.5;
		return thenable.then(
			function(value){
				var duration = this.duration;
				var diff = duration - expectedDuration;
				return Math.abs(diff) > acceptableDifference;
			}.bind(this)
		);
	},

	createMessage(thenable, expectedDuration){
		var duration = this.duration;
		var diff = duration - expectedDuration;

		if( duration > expectedDuration ){
			return 'TOO_FAST : resolving took much time than expected (+' + diff  + 'ms)';
		}
		else{
			return 'TOO_SLOW : resolving took less time than expected (-' + -diff  + 'ms)';
		}
	}
});