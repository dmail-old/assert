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

function isObject(value){
	return typeof value === 'object' && value !== null;
}

function isPlainObject(value){
	return value != null && Object.getPrototypeOf(value) === Object.prototype;
}

function sameProto(a, b){
	return Object.getPrototypeOf(a) === Object.getPrototypeOf(b);
}

function match(actual, expected){
	var matchAssertion = MatchAssertion.create(actual, expected);

	matchAssertion.exec();

	return matchAssertion;
}

var MatchAssertion = Assertion.extend({
	type: 'match',
	maxDifferences: 10,
	differencesOverflow: false,
	states: ['FAILED', 'ABSENT', 'DIFFERENT_VALUES', 'DIFFERENT_TYPES', 'DIFFERENT'],

	compare(actual, expected){
		if( actual === expected ){
			return true;
		}
		if( expected != null && typeof expected.equals === 'function' && expected.equals(actual) ){
			return true;
		}
		return false;
	},

	collectDifferences(actual, expected, keyPath){
		var keyPrefix = keyPath ? keyPath + '.' : '';

		if( false === this.compare(actual, expected) ){
			for(var key in Object.keys(expected) ){
				if( this.differences.length > this.maxDifferences ){
					this.differencesOverflow = true;
					break;
				}

				var propertyPath = keyPrefix + key;
				var actualValue = actual[key];
				var expectedValue = expected[key];

				if( isObject(expectedValue) && isObject(actualValue) ){
					this.collectDifferences(actualValue, expectedValue, propertyPath);
				}
				else{
					var matchAssertion = match(actualValue, expectedValue);

					if( matchAssertion.failed ){
						matchAssertion.propertyPath = propertyPath;
						this.differences.push(matchAssertion);
					}
				}
			}
		}
	},

	compareObjects(actual, expected){
		this.differences = [];
		this.collectDifferences(actual, expected);

		return this.differences.length === 0;
	},

	check(actual, expected){
		var reason;
		var valid;

		// actual & expected are not the same
		if( false === this.compare(actual, expected) ){
			valid = false;
			reason = 'DIFFERENT';

			// some circumstances allow match to pass where a simple equal would fail

			var actualType = this.actualType = getTypeName(actual);
			var expectedType = this.expectedType = getTypeName(expected);

			// regexp & string
			if( expectedType === 'RegExp' && actualType === 'String' ){
				if( expected.test(actual) ){
					valid = true;
				}
				else{
					reason = 'FAILED';
				}
			}
			// string & string
			else if( expectedType === 'String' && actualType === 'String' ){
				if( expected.contains(actual) ){
					valid = true;
				}
				else{
					reason = 'ABSENT';
				}
			}
			// Array or plainObject expected or actual and expected share their proto
			else if( expectedType === 'Array' || isPlainObject(expected) || sameProto(actual, expected) ){
				if( this.compareObjects(actual, expected) ){
					valid = true;
				}
				else{
					reason = 'DIFFERENT_VALUES';
				}
			}
			// others
			else if( actualType != expectedType ){
				reason = 'DIFFERENT_TYPES';
			}
			// same type but === failed and not the same proto
			else{
				// it may happen for something like
				// actual = new (function name(){})();
				// expected = new (function name(){})();
				reason = 'DIFFERENT';
			}
		}
		else{
			valid = true;
		}

		if( valid === true ){
			this.pass();
		}
		else if( valid === false ){
			this.fail(reason);
		}
		else{
			throw new Error('match valid must be true or false');
		}
	}
});

var ArgumentLengthIsAssertion = Assertion.extend({
	type: 'argumentLengthIs',

	get actualLength(){
		return this.value.length;
	},

	get expectedLength(){
		return this.args[1];
	},

	get allowRest(){
		return Boolean(this.args[2]);
	},

	check(){
		var actualLength = this.actualLength;
		var expectedLength = this.expectedLength;
		var allowRest = this.allowRest;

		if( actualLength < expectedLength ){
			this.fail('NOT_ENOUGH_ARGUMENT');
		}
		else if( !allowRest && actualLength > expectedLength ){
			this.fail('TOO_MUCH_ARGUMENT');
		}
		else{
			this.pass();
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

export default MatchAssertion;