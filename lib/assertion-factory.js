import Assertion from './assertion.js';

var AssertionFactory = {
	assertions: {},

	create(type){
 		var AssertionType = this.get(type), assertion;

 		assertion = AssertionType.create.apply(AssertionType, Array.prototype.slice.call(arguments, 1));
 		assertion.factory = this;

 		return assertion;
	},

	get(type){
		return this.assertions[type];
	},

	set(type, assertion){
		this.assertions[type] = assertion;
	},

	define(type, properties){
		var assertion = Assertion.extend(properties);

		assertion.type = type;

		return assertion;
	},

	register(type, properties){
		var assertion = this.define(type, properties);

		return this.set(type, assertion);
	},

	assert(){
		return this.create.apply(this, arguments);
	}
};

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

AssertionFactory.register('thenable', {
	check(value){
		if( false === Thenable.is(value) ){
			this.fail();
		}
		else{
			this.pass();
		}
	}
});

AssertionFactory.register('resolve', {
	check(value){
		return value.then(
			function(resolutionValue){
				this.pass(resolutionValue);
				return resolutionValue;
			},
			function(rejectionValue){
				this.fail(rejectionValue);
				return rejectionValue;
			}.bind(this)
		);
	}
});

AssertionFactory.register('is', {
	check(value, expectedType){
		var valueType = global.getTypeName(value);

		if( valueType != expectedType ){
			this.fail(valueType);
		}
		else{
			this.pass();
		}
	}
});

AssertionFactory.register('resolveMatch', {
	check(thenable, expectedResolutionValue){
		return thenable.then(function(resolutionValue){
			// le truc c'est qu'il va me manque resolutionvalues

			if( false === match(resolutionValue, expectedResolutionValue) ){
				this.fail();
			}
			else{
				this.pass();
			}

			return resolutionValue;
		}.bind(this));
	}
});


AssertionFactory.register('resolveWith', {
	check: api.create(function check(thenable, expectedResolutionValue){

	});


		return becomeAssertionListResult(this, [
			assert('thenable', thenable),
			assert('resolve', thenable),
			assert('resolveMatch', thenable, expectedResolutionValue)
		]);
	}
});

AssertionFactory.register('resolveIn', {
	check(thenable, expectedDuration, acceptableDifference){
		// assert('is', thenable, 'thenable')
		// assert('arguments.length is 2 or 3')
		// assert('is', 'expectedDuration', Number)
		// assert('is', acceptableDifference, Number)
		// assert('willResolve', thenable)

		if( acceptableDifference == null ){
			acceptableDifference = expectedDuration * 0.3 + 5;
		}

		this.timeoutDuration = expectedDuration + acceptableDifference + expectedDuration * 0.5;

		var start = new Date();
		return Promise.resolve(thenable).then(
			function(value){
				var duration = new Date() - start;
				var diff = duration - expectedDuration;

				if( Math.abs(diff) > acceptableDifference ){
					if( duration > expectedDuration ){
						return 'resolving took much time than expected (+' + diff  + 'ms)';
					}
					else{
						return 'resolving took less time than expected (-' + -diff  + 'ms)';
					}
				}
			}
		);
	}
});

AssertionFactory.register('willTimeout', {
	check(thenable, ms){
		ms = ms || 10;

		// assert('arguments length is 1 or 2');
		// assert('is', thenable, thenable);
		// assert('is', ms, Number);

		this.timeoutDuration = 0; // do not use a timeout, it's handled by the one below

		return Promise.race([
			new Promise(function(resolve, reject){
				setTimeout(resolve, ms);
			}),
			thenable.then(
				function(value){
					// thenable expected to timeout is resolved with value
				},
				function(value){
					// thenable expected to timeout is rejected with value
				}
			)
		]);
	}
});

*/

export default AssertionFactory;