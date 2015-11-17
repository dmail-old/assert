import proto from 'proto';

import Timeout from '../node_modules/@dmail/timeout/index.js';
import Thenable from '../node_module/@dmail/thenable/index.js';
import Iterable from '../node_module/@dmail/iterable/index.js';

var Expectation = proto.extend({
	name: undefined,
	result: undefined,

	constructor: function Expectation(){

	},

	check(){
		return false;
	},

	exec(){
		// dependning if check returns a thenable, return the expectation state immedialty
		// or via promise
	}
});

var ExpectationFactory = {
	expectations: {},

	create(type){
 		var ExpectationType = this.get(type), expectation;

 		expectation = ExpectationType.create.apply(ExpectationType, Array.prototype.slice.call(arguments, 1));
 		expectation.factory = this;

 		return expectation;
	},

	get(type){
		return this.expectations[type];
	},

	set(type, expectation){
		this.expectations[type] = expectation;
	},

	register(type, properties){
		var expectation = Expectation.extend(properties);

		expectation.type = type;

		return this.set(type, expectation);
	},

	assert(){
		return this.create.apply(this, arguments).exec();
	}
};

ExpectationFactory.register('thenable', {
	check(value){
		return Thenable.is(value);
	}
});

ExpectationFactory.register('resolve', {
	check(value){
		return value.catch(this.fail.bind(this));
	}
});

ExpectationFactory.register('is', {
	mapValue(value){
		return global.getTypeName(value);
	},

	check(type, expectedType){
		return type == expectedType;
	}
});

ExpectationFactory.register('settleBefore', {
	check(thenable, maxDuration){
		var timeoutPromise = new Promise(function(resolve){
			setTimeout(resolve, maxDuration);
		});

		return new Promise(function(resolve, reject){

			thenable.then(
				function(){
					this.pass();
					resolve();
				}.bind(this),
				function(){
					this.pass();
					resolve();
				}.bind(this)
			);

			// timedout
			timeoutPromise.then(function(){
				if( false === this.passed ){
					this.fail();
					resolve(this);
				}
			}.bind(this));
		}.bind(this));
	}
});

function createExpectationResultFromList(expectations){
	// check all expectations
	var expectationResultList = expectations.map(function(expectation){
		return expectation.check();
	});

	var anExpectationIsAsync = expectationResultList.some(function(expectationResult){
		return Thenable.is(expectationResult);
	});

	// returns async the first failed expectation or null
	if( anExpectationIsAsync ){
		return Iterable.findThenable(expectationResultList, function(expectationResult){
			return expectationResult.failed;
		});
	}
	// returns sync the first failed expectation or null
	else{
		return expectationResultList.find(function(expectationResult){
			return expectationResult.failed;
		});
	}
}

ExpectationFactory.register('resolveWith', {
	check(thenable, expectedResolutionValue){
		return getFirstFailedExpectation([
			assert('thenable', thenable),
			assert('resolve', thenable),
			assert('resolveMatch', thenable, expectedResolutionValue),
			assert('settleBefore', 100)
		]);
	}
});

export default Expectation;