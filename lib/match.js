import AssertionFactory from './assertion-factory.js';

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
		if( name === 'constructor' || name == 'undefined' ){
			name = 'Object';
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

var MatchAssertion = AssertionFactory.define('match', {
	maxDifferences: 10,
	differencesOverflow: false,

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
		// actual & expected are not the same, but it's maybe ok
		if( false === this.compare(actual, expected) ){
			var actualType = this.actualType = getTypeName(actual);
			var expectedType = this.expectedType = getTypeName(expected);

			// regexp & string
			if( expectedType === 'RegExp' && actualType === 'String' ){
				if( false === expected.test(actual) ){
					this.reason = 'FAILED';
					this.fail();
				}
			}
			// string & string
			else if( expectedType === 'String' && actualType === 'String' ){
				if( false === expected.contains(actual) ){
					this.reason = 'ABSENT';
					this.fail();
				}
			}
			// Array, plainObject, prototype Objects
			else if( expectedType === 'Array' || isPlainObject(expected) || sameProto(actual, expected) ){
				if( false === this.compareObjects(actual, expected) ){
					this.reason = 'DIFFERENT_VALUES';
					this.fail();
				}
			}
			// others
			else{
				// type is not the same
				if( actualType != expectedType ){
					this.reason = 'DIFFERENT_TYPES';
					this.fail();
				}
				// type is the same but objects are different
				// -> NEVER supposed to happen considering the sameProto()
				// which is supposed to mean they have the same types
				else{
					this.reason = 'DIFFERENT';
					this.fail();
				}
			}
		}
	}
});

export default MatchAssertion;