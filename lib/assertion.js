// all assertion should be async

import proto from 'proto';

import Timeout from '../node_modules/@dmail/timeout/index.js';
import Thenable from '../node_module/@dmail/thenable/index.js';
import Iterable from '../node_module/@dmail/iterable/index.js';

import isCircular from './is-circular.js';

/*
var error = this.createError('assertion is too slow (more than ' + this.timeout + ' ms)');
error.code = 'ASSERTION_TIMEOUT';

assertionError.origin = this.caller;
*/

function AssertionError(message){
	var error = new Error();
	var assertionError = error;

	assertionError.name = AssertionError.constructor.name;
	assertionError.constructor = AssertionError;
	assertionError.message = message || 'failed assertion';

	return assertionError;
}

function match(){

}

var Assertion = proto.extend({
	type: undefined,
	result: undefined,
	failed: false,
	passed: false,
	timeoutDuration: 100,

	constructor: function Assertion(){
		this.timeout = Timeout.create(this.expire, this);

		this.args = arguments;
	},

	toJSON(){
		var properties = {
			type: this.type,
			args: Array.prototype.map.call(this.args, function(arg){
				return isCircular(arg) ? String(arg) : arg;
			}),
			result: this.result,
			state: this.state,
			startDate: this.startDate,
			endDate: this.endDate,
			caller: this.caller
		};

		return properties;
	},

	check(){
		return false;
	},

	fail(reason){
		this.failed = true;
		if( reason === 'timeout' ){
			this.state = 'timedout';
		}
		else if( reason === 'error' ){
			this.state = 'errored';
		}
		else{
			this.state = 'failed';
		}

		this.resolve(this);
	},

	pass(reason){
		this.passed = true;
		if( reason ){
			this.state = reason;
		}
		else{
			this.state = 'passed';
		}

		this.resolve(this);
	},

	expire(){
		this.fail('timeout');
	},

	get duration(){
		return this.endDate ? this.endDate - this.startDate : 0;
	},

	exec(){
		this.timeout.set(this.timeoutDuration);

		var checkPromise = Thenable.applyFunction(this.check, this, this.args);

		checkPromise = Thenable.after(checkPromise, function(value, resolved){
			this.result = value;

			if( resolved ){
				this.pass();
			}
			else{
				this.fail('error');
			}
		}, this);

		var explicitResultPromise = new Promise(function(resolve, reject){
			this.resolve = resolve;
			this.reject = reject;
		}.bind(this));

		var assertionReadyPromise = Promise.race([
			checkPromise,
			explicitResultPromise,
		]);

		this.startDate = new Date();
		assertionReadyPromise = Thenable.after(assertionReadyPromise, function(value, resolved){
			this.endDate = new Date();
		}, this);

		return assertionReadyPromise;
	}
});

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

	register(type, properties){
		var assertion = Assertion.extend(properties);

		assertion.type = type;

		return this.set(type, assertion);
	},

	assert(){
		return this.create.apply(this, arguments);
	}
};

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
				this.pass();
				return resolutionValue;
			},
			function(rejectionValue){
				this.fail();
				return rejectionValue;
			}.bind(this)
		);
	}
});

AssertionFactory.register('is', {
	check(value, expectedType){
		var valueType = global.getTypeName(value);

		if( valueType != expectedType ){
			this.fail();
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

			if( match(resolutionValue, expectedResolutionValue) ){
				this.pass();
			}
			else{
				this.fail();
			}

			return resolutionValue;
		}.bind(this));
	}
});

function getFirstFailedAssertion(assertionList){
	// exec assertion
	var iterableAssertionPromiseList = Iterable.map(assertionList, function(assertion){
		return assertion.exec();
	});

	return Iterable.findThenable(iterableAssertionPromiseList, function(assertion){
		return assertion.failed;
	});
}

function assert(){
	return AssertionFactory.assert.apply(AssertionFactory, arguments);
}

AssertionFactory.register('resolveWith', {
	check(thenable, expectedResolutionValue){
		return getFirstFailedAssertion([
			assert('thenable', thenable),
			assert('resolve', thenable),
			assert('resolveMatch', thenable, expectedResolutionValue)
		]).then(function(failedAssertion){

		});
	}
});

export default AssertionFactory;