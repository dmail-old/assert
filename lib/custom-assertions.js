/*
	I will not collect differences, if a property does not match I'll just log this one
*/

import Assertion from './assertion.js';
import proto from 'proto';

import getTypeName from './get-type.js';

function prefixWithArticle(noun){
	var firstChar = noun[0].toLowerCase();
	var prefix;

	if( ['a', 'e', 'i', 'o', 'u'].indexOf(firstChar) > -1 ){
		prefix = 'an';
	}
	else{
		prefix = 'a';
	}

	return prefix + ' ' + noun;
}

function createFailedTypeAssertionMessage(actualType, expectedType){
	var message = '';

	message+= ' got ';
	if( actualType === 'null' || actualType === 'undefined' ){
		message+= actualType;
	}
	else{
		message+= prefixWithArticle(actualType);
	}

	message+= 'but ';
	if( expectedType === 'null' || expectedType === 'undefined' ){
		message+= expectedType;
	}
	else{
		message+= prefixWithArticle(expectedType);
	}
	message+= 'was expected';

	return message;
}

var EqualsAssertion = Assertion.extend({
	type: 'equals',

	check(actual, expected){
		if( actual === expected ){
			return true;
		}
		if( expected != null && typeof expected.equals === 'function' && expected.equals(actual) ){
			return true;
		}
		return false;
	},

	createMessage(actual, expected){
		var actualType = getTypeName(actual);
		var expectedType = getTypeName(expected);

		if( actualType != expectedType ){
			return createFailedTypeAssertionMessage(actualType, expectedType);
		}

		return actual + ' is not ' + expected;
	}
});

var assert = function(){
};

function isObject(value){
	return typeof value === 'object' && value !== null;
}

var ObjectEqualsAssertion = Assertion.extend({
	params: ['actualObject', 'expectedObject', {name: 'keyPath', type: String, value: ''}],

	check(actualObject, expectedObject, keyPath){
		try{
			assert('equals', actualObject, expectedObject);
		}
		catch(failedEqualsAssertion){
			var keyPrefix = keyPath ? keyPath + '.' : '';

			Object.keys(expectedObject).forEach(function(key){
				var propertyPath = keyPrefix + key;
				var actualObjectPropertyValue = actualObject[key];
				var expectedObjectPropertyValue = expectedObject[key];

				if( isObject(actualObjectPropertyValue) && isObject(expectedObjectPropertyValue) ){
					assert('objectEquals', actualObjectPropertyValue, expectedObjectPropertyValue, propertyPath);
				}
				else{				
					assert('match', actualObjectPropertyValue, expectedObjectPropertyValue, propertyPath);
				}
			});
		}
	}
});

var StringContainsAssertion = Assertion.extend({
	type: 'stringContains',

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

var MatchAssertion = Assertion.extend({
	type: 'match',
	params: ['actual', 'expected', {name: 'propertyPath', type: String, value: ''}], // allow propertyPath to be undefined

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

var ResolveWithAssertion = Assertion.extend({
	type: 'resolveWith',
	params: ['thenable', 'expectedResolutionValue'],

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

var ResolveInAssertion = Assertion.extend({
	type: 'resolveIn',
	params: [
		{name: 'thenable', type: 'thenable'},
		{name: 'expectedResolutionValue', type: Number, value: 10},
		{name: 'acceptableDifference', type: Number, value(thenable, expectedDuration){ return expectedDuration * 0.3 + 5; }}
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