import proto from 'proto';

import Thenable from '../node_modules/@dmail/thenable/index.js';
import AssertionFactory from './assertion.js';

function getTypeName(value){
	var name;

	if( value === null ){
		name = 'null';
	}
	else if( value === undefined ){
		name = 'undefined';
	}
	else{
		if( value.constructor ){
			value = value.constructor;
		}
		else{
			value = Object.getPrototypeOf(value);
		}

		if( value.hasOwnProperty('name') ){
			name = value.name;
		}
		else{
			name = String(value);
		}

		if( name === 'constructor' || name == 'undefined' ){
			name = 'Object';
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

function createAssertionTypeErrorMessage(actualType, expectedType){
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

function assertMatch(){

}

function assertResolutionValueMatch(actualResolutionValue, expectedResolutionValue){
	// same as assertMatch but the message of failure states it was a thenable
	// 'thenable has resolved but ' + mismatchMessage;
}

/*
AssertionFactory.register('is', {
	mapActualValue(actualValue){
		return getTypeName(actualValue);
	},

	test(actualType, expectedType){
		return actualType == expectedType;
	}
});

AssertionFactory.register('thenable', {
	test(actualValue){
		return Thenable.is(actualValue);
	}
});

AssertionFactory.register('resolve', {
	createMessage(){
		return 'thenable expected to resolve is rejected with ' + this.failureValue;
	},

	test(actualThenable){
		return actualThenable.catch(this.fail.bind(this));
	}
});
*/


// je pense qu'on peut partir sur mon modèle comme validity
// des input HTML5
// on on vérifie plusieurs choses

AssertionFactory.register('resolveWith', {
	test(actualValue, expectedResolutionValue){
		return Promise.all([
			assertAsync('thenable', actualValue),
			assertAsync('resolve', actualValue),
			assertAsync('resolveMatch', actualvalue, expectedResolutionValue)
		]);
	},

	createFailedMessage(result){
		if( result.type == 'thenable' ){
			var actualValueType = this.getTypeName(result.value);
			var actualValueMessage = prefixWithArticle(actualValueType);
			return 'got ' + actualValueMessage' but expecting a thenable';
		}
		else if( result.type === 'resolve' ){
			return 'thenable has rejected with ' + result.value + ' but was expecting to resolve with' + result.expected;
		}
		else if( result.type === 'resolveMatch' ){
			return 'thenable has resolved but ' + result.message;
		}
	}
});
