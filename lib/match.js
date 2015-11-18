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

function isObject(value){
	return typeof value === 'object' && value !== null;
}

function isPlainObject(value){
	return Object.getPrototypeOf(value) === Object.prototype;
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
		if( actual == expected ){
			return true;
		}
		if( typeof expected.equals === 'function' && expected.equals(actual) ){
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

	compareTypes(){
		if( this.actualName != this.expectedName ){
			this.fail('invalid');
		}
	},

	check(actual, expected){
		var actualName = this.actualName = getTypeName(actual);
		var expectedName = this.expectedName = getTypeName(expected);

		if( expectedName === 'Boolean' ){
			this.compareTypes();
			if( false === this.failed && actual !== expected ){
				this.fail('mismatch');
			}
		}
		else if( expectedName === 'String' ){
			this.compareTypes();
			if( false === this.failed && actual.indexOf(expected) === -1 ){
				this.fail('mismatch');
			}
		}
		else if( expectedName === 'Function' ){
			if( !expected(actual) ){
				this.fail('mismatch');
			}
		}
		else if( expectedName === 'RegExp' ){
			if( actualName === 'String' ){
				if( false === expected.test(actual)  ){
					this.fail('mismatch');
				}
			}
			else{
				this.compareTypes();
				if( false === this.failed && actual !== expected ){
					this.fail('mismatch');
				}
			}
		}
		else if( expectedName === 'Number' ){
			this.compareTypes();
			if( false === this.failed && actual !== expected ){
				this.fail('mismatch');
			}
		}
		else if( expectedName === 'null' ){
			this.compareTypes();
			if( false === this.failed && actual !== expected ){
				this.fail('mismatch');
			}
		}
		else if( expectedName === 'undefined' ){
			this.compareTypes();
			if( false === this.failed && actual !== expected ){
				this.fail('mismatch');
			}
		}
		// "Object" & other expectedName, compare prototytpe & or properties
		else{
			if( actual === null || actual === undefined ){
				this.fail('invalid');
			}
			// expecting plain object or Array allow to compare even if proto is !=
			else if( expectedName === 'Array' || isPlainObject(expected) || Object.getPrototypeOf(expected) === Object.getPrototypeOf(actual) ){
				this.differences = [];
				this.collectDifferences(actual, expected);

				var length = this.differences.length;

				if( length > 0 ){
					this.fail('mismatch');
				}
			}
			// they don't have the same proto
			else{
				this.compareTypes();
				// the constructor got the same name but the proto is different
				if( false === this.failed ){
					this.fail('mismatch');
				}
			}
		}
	}
});

export default MatchAssertion;