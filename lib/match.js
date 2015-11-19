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

		if( reason ){
			this.reason = reason;
		}
		if( valid === true ){
			this.pass();
		}
		else if( valid === false ){
			this.fail();
		}
		else{
			throw new Error('match valid must be true or false');
		}
	}
});

export default MatchAssertion;