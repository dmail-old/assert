/*
	I will not collect differences, if a property does not match I'll just log this one
*/

import proto from 'proto';

import Assertion from './assertion.js';
import getTypeName from './get-type.js';
import AssertionFactory from './assertion-factory.js';

import Schema from '';

var assert;

var EqualsAssertion = Assertion.define('equals', {	
	schema: [undefined], // one argument but any argument is ok
	test(actual, expected){
		return Schema.create({equal: expected}).validate(actual);
	}
});

var LikeAssertion = Assertion.define('like', {
	schema: [Object],
	test(actual, expected){
		return Schema.create();
	}
});

var StringContainsAssertion = Assertion.define('contains', {
	check(string, substring){
		return string.contains(substring);
	},

	createMessage(string, substring){
		return substring + ' is not contained in ' + string;
	}
});

var RegExpTestAssertion = Assertion.extend({
	type: 'regExpTest',

	check(regExp, string){
		return regExp.test(string);
	},

	createMessage(regExp, string){
		return string + ' does not verifiy the regexp ' + regExp;
	}
});

function isPlainObject(value){
	return value != null && Object.getPrototypeOf(value) === Object.prototype;
}

function sameProto(a, b){
	return Object.getPrototypeOf(a) === Object.getPrototypeOf(b);
}

var MatchAssertion = Assertion.define('match', {
	schemas: [
		undefined,
		undefined,
		{type: 'string', default: ''}
	],

	check(actual, expected, propertyPath){
		try{
			assert('equals', actual, expected);
		}
		// some circumstances allow match to pass where a simple equal would fail
		catch(failedEqualAssertion){
			var actualType = getTypeName(actual);
			var expectedType = getTypeName(expected);

			// regexp & string
			if( expectedType === 'RegExp' && actualType === 'String' ){
				assert('regExpTest', expected, actual);
			}
			// string & string
			else if( expectedType === 'String' && actualType === 'String' ){
				assert('stringContains', expected, actual);
			}
			// Array or plainObject expected or actual and expected share their proto
			else if( expectedType === 'Array' || isPlainObject(expected) || sameProto(actual, expected) ){
				assert('objectEquals', actual, expected, propertyPath);
			}
			else{
				throw failedEqualAssertion;
			}
		}
	},

	createMessage(actual, expected, propertyPath){
		var failedAssertion = this.failedAssertion;
		var message;

		if( propertyPath ){
			message = propertyPath + ' does not match ' + failedAssertion.message;
		}
		else{
			message = failedAssertion.message;
		}

		return message;
	}
});

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

export default AssertionFactory;