/*
	I will not collect differences, if a property does not match I'll just log this one
*/

import Assertion from './assertion.js';
import proto from 'proto';

function getTypeName(value){
	var name;

	if( value === null ){
		name = 'null';
	}
	else if( value === undefined ){
		name = 'undefined';
	}
	else{
		name = value.constructor.name;

		if( name === 'constructor' || name == 'undefined' || name === '' ){
			if( proto.type in value ){
				name = value[proto.type];
			}
			else{
				name = 'Object';
			}
		}
	}

	return name;
}

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
	names: ['actual', 'expected'],

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

var ArgumentLengthEqualsAssertion = Assertion.extend({
	type: 'argumentLengthEquals',
	names: ['actualArguments', 'expectedLength', 'allowRest'],

	check(actualArguments, expectedLength, allowRest){
		var actualLength = actualArguments.length;

		if( allowRest ){
			return actualLength < expectedLength;
		}
		else{
			return actualLength === expectedLength;
		}
	},

	createMessage(actualArguments, expectedLength, allowRest){
		var actualLength = actualArguments.length;

		if( actualLength < expectedLength ){
			return 'NOT_ENOUGH_ARGUMENT : signature expect ' + expectedLength + ' arguments, ' + actualLength + ' given';
		}
		else{
			return 'TOO_MUCH_ARGUMENT : signature expect ' + expectedLength + ' arguments, ' + actualLength + ' given';
		}
	}
});

var assert = function(){
};

function isObject(value){
	return typeof value === 'object' && value !== null;
}

var ObjectEqualsAssertion = Assertion.extend({
	names: ['actualObject', 'expectedObject', 'keyPath'],

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
	names: ['string', 'substring'],

	check(string, substring){
		return string.contains(substring);
	},

	createMessage(string, substring){
		return substring + ' is not contained in ' + string;
	}
});

var RegExpTestAssertion = Assertion.extend({
	type: 'regExpTest',
	names: ['regExp', 'string'],

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
	params: ['actual', 'expected', 'propertyPath'],

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
	params: [
		{name: 'thenable', type: 'thenable'},
		'expectedResolutionValue'
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

var ResolveInAssertion = Assertion.extend({
	type: 'resolveIn',
	params: [
		{name: 'thenable', type: 'thenable'},
		{name: 'expectedResolutionValue', type: Number, value: 10},
		{name: 'acceptableDifference', type: Number, value(){ return this.getParam('expectedDuration') * 0.3 + 5; }}
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


/*
var CallSignatureAssertion = Assertion.extend({
	type: 'callSignature',
	states: ['NOT_ENOUGH_ARGUMENT', 'TOO_MUCH_ARGUMENT', 'INVALID_ARGUMENT', 'INVALID_THIS'],

	get thisValue(){
		return this.args[0];
	},

	get argumentValues(){
		return this.args[1];
	},

	check(expectations){

		if( 'expectedArguments' in expectations ){
			var actualArgs = args;
			var expectedArguments = expectations.expectedArguments;
			var expectedArgLength = expectedArguments.length;

			this.assert('ARGUMENT_LENGTH', 'argumentLengthIs', actualArgs, expectedArgLength, expectations.allowRestArguments);

			// j'ai besoin de savoir quel argument fail
			// et que c'est l'argument qui match pas et pas le this
			// définir comment je fais ça
			expectedArguments.find(function(expectedArgumentValue, index){
				var actualArgumentValue = args[index];
				this.assert('ARGUMENT_MATCH', 'match', actualArgumentValue, expectedArgumentValue);
			});
		}

		if( 'expectedThis' in expectations ){
			var matchAssertion = match(thisValue)

			this.assert('INVALID_THIS', 'match', thisValue, expectations.expectedThis);
		}
	}
});
*/