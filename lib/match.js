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
	return getTypeName(value) === 'object';
}

function isPlainObject(value){
	return Object.getPrototypeOf(value) === Object.prototype;
}

function match(actual, expected){
	var matchAssertion = MatchAssertion.create(actual, expected);

	matchAssertion.exec();

	if( matchAssertion.failed ){
		return {
			actual: actual,
			expected: expected,
			actualName: matchAssertion.actualName,
			expectedName: matchAssertion.expectedName
		};
	}
}

// j'ai presque besoin d'un validityState à l'intérieur de matchAssertion
// en tous cas une liste des failedAssertions pour toutes les propriété que je compare

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

	collectDifferences(actual, expected){
		if( false === this.compare(actual, expected) ){
			Object.keys(expected).forEach(function(key){
				if( this.differences.length > this.maxDifferences ){
					this.differencesOverflow = true;
				}
				else{
					var actualValue = actual[key];
					var expectedValue = expected[key];

					if( isObject(expectedValue) && isObject(actualValue) ){
						this.collectDifferences(actualValue, expectedValue);
					}
					else{
						var difference = match(actualValue, expectedValue);

						if( difference ){
							this.differences.push({key: key, reason: difference});
						}
					}
				}
			}, this);
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
			if( ['Boolean', 'String', 'Number', 'null', 'undefined'].indexOf(actualName) > -1 ){
				this.fail('invalid');
			}
			// expecting plain object allow to compare even if proto is !=
			else if( expectedName === 'Array' || isPlainObject(expected) || Object.getPrototypeOf(expected) === Object.getPrototypeOf(actual) ){
				var differences = this.differences = [];
				this.collectDifferences(actual, expected);
				var length = differences.length;

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