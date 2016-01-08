/*

l'api doit comprendre ceci:

expect(spy).willBeCalledWith([undefined]).willBeCalledOn(undefined).willThrowWith();

// il faut donc faire

willTake(duration, acceptableDiference = duration * 0.3*5)
willResolve(with = undefined)
willReject(with = undefined)
willBePending(duration = 100)
willBeCalled(with = undefined)
willBeCalledOn(expectedThisValue)
willThrow()

chacun de ces trucs est une assertion
faut changer l'api pour avoir quelque chose qui ressemble vraiment à la version finale

on voit bien que willTake c'est la combinaison de willResolve or willReject + expectedDuration

une assertion peut s'assurer d'un état et/ou d'un temps et/ou d'une valeur et/ou d'un résultat

bon en gros je viens de comprendre -> ça marche comme schema
y'a un valueContainer et 0 à X assertions
chaque assertion est compatible ou non avec la valeur ce qui émet une erreur sur l'object expect()
si l'assertion fail plus tard elle reject l'objet expect.promise
de sorte que expect(thenable).willTake(100).willResolve() retourne l'objet expect

en gros c'est la même API que schema sauf qu'on construit l'objet au fur est à mesure

*/

import proto from 'proto';

import Timeout from '../node_modules/@dmail/timeout/index.js';
import Thenable from '../node_module/@dmail/thenable/index.js';
import api from '../node_modules/@dmail/api/index.js';

import isCircular from './is-circular.js';

import ValueContainer from '../node_modules/@dmail/schema/lib/value-container.js';

function AssertionError(code, message){
	var error = new Error();

	error.constructor = AssertionError;
	error.name = error.constructor.name;
	error.code = code;
	error.message = message;

	return error;
}

var ValueAssertionHandler = proto.extend('ValueAssertionHandler', {
	incompatibilities:  [
		['willSettle', 'willBePending'],
		['willResolve', 'willReject'],
		['willbeCalled', 'willNotBeCalled'],
		['willReturn', 'willThrow']
	],

	constructor: api(
		function(value){
			this.value = value;
			this.meta = new Map();
			this.promise = new Promise(function(resolve, reject){
				this.resolve = resolve;
				this.reject = reject;
			}.bind(this));
			this.assertions = [];
		}
	),

	then(onResolve, onReject){
		return this.promise.then(onResolve, onReject);
	},

	catch(onReject){
		return this.then(null, onReject);
	},

	checkAssertionCompatibility(assertionName){
		var incompatibleAssertionName;

		for(var incompatibilityPair of this.incompatibilities){
			var leftAssertion = incompatibilityPair[0];
			var rightAssertion = incompatibilityPair[1];

			if( assertionName === leftAssertion ){
				incompatibleAssertionName = rightAssertion;
				break;
			}
			if( assertionName === rightAssertion ){
				incompatibleAssertionName = leftAssertion;
				break;
			}
		}

		if( incompatibleAssertionName && this.assertionWasMadeBefore(incompatibleAssertionName) ){
			throw this.createError('cannot use ' + assertionName + ' assertion when previously using ' + incompatibleAssertionName + ' assertion');
		}
	},

	assertionWasMadeBefore(assertionName){
		return false;
	},

	assertionWasNeverMadeBefore(assertionName, assertionArgs){
		return true;
	},

	assert(name, ...assertionArgs){
		// only if the state is pending, else it's useless to do more assertion on value
		if( this.state === 'pending' ){
			if( this.assertionWasNeverMadeBefore(name, assertionArgs) ){
				try{
					this.checkAssertionCompatibility(name);

					var assertion = null;
					var args = [this.value].concat(assertionArgs);

					assertion.exec();

					// if does not throw listen for eventual async rejection
					if( name.startsWith('will') ){
						assertion.catch(this.reject.bind(this));
					}
				}
				catch(e){
					this.reject(e);
					throw e;
				}
			}
		}
	}
});

var Assertion = proto.extend('Assertion', {
	name: undefined,
	isValid: undefined,
	state: 'PENDING',
	result: undefined,
	expectedState: '',
	expectedResult: undefined,

	constructor(){
		this.args = arguments;
		this.stack = new Error().stack; // want to know who is calling this assertion in case it fails
	},

	define(name, method, schema){
		return Assertion.extend({
			type: name,
			check: api.apply(null, arguments)
		});
	},

	setState(state, result){
		if( this.state === 'PENDING' ){
			this.state = state;
			this.result = result;
			if( state === 'ERRORED' ){
				throw this;
			}
		}
	},

	check(value){
		return value;
	},

	exec(args){
		var returnValue, errored, error;

		try{
			returnValue = this.check.apply(this, args);
		}
		catch(e){
			errored = true;
			error = e;
		}

		if( errored ){
			this.setState('ERRORED', error);
		}
		else{
			this.setState('RETURNED', returnValue);
		}

		return this;
	},

	toJSON(){
		var properties = {
			name: this.name,
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
	}
});

var AsyncAssertion = Assertion.extend('AsyncAssertion', {
	timeoutDuration: 100,

	then(onResolve, onReject){
		return this.promise.then(onResolve, onReject);
	},

	catch(onReject){
		return this.then(null, onReject);
	},

	expire(){
		this.timedout = true;
		this.forceResultResolution();
	},

	get duration(){
		return this.endDate ? this.endDate - this.startDate : 0;
	},

	exec(){
		// must ensure value is thenable
		var value = this.args[0];

		if( false === Thenable.is(value) ){
			throw this.createError(this.name + ' value must be thenable');
		}

		this.timeout = Timeout.create(this.expire, this);
		this.timeout.set(this.timeoutDuration);
		this.promise = new Promise(function(resolve, reject){
			this.resolve = resolve;
			this.reject = reject;
		}.bind(this));

		var explicitResultPromise = new Promise(function(resolve, reject){
			this.forceResultResolution = resolve;
			this.forceResultResolution = reject;
		}.bind(this));

		var resultPromise = Promise.race([
			value,
			explicitResultPromise,
		]);

		this.startDate = new Date();
		resultPromise = Thenable.after(resultPromise, function(value, resolved){
			this.endDate = new Date();

			var args = [].concat(this.args);
			args[0] = value;

			if( this.timedout ){
				this.state = 'TIMEDOUT';
				//this.setState('TIMEDOUT', this.timeoutDuration);
			}
			else if( resolved ){
				this.state = 'RESOLVED';
				this.exec(args);
			}
			else{
				this.state = 'REJECTED';
				this.exec(args);
			}
		}, this);

		return this;
	}
});

var Match = Assertion.define('match', {
	check(value){

	}
});

var WillSettle = AsyncAssertion.define('willSettle', {
	check(){
		if( this.state === 'TIMEDOUT' ){
			throw this.createError('thenable must settle in less than ' + this.timeoutDuration + ' ms');
		}
	}
});

var WillBePending = AsyncAssertion.define('willBePending', {
	incompatibilities: ['willSettle'],
	check(){
		if( this.state !== 'TIMEDOUT' ){
			var message = 'thenable must be pending during at least ' + this.timeoutDuration + 'ms but ';

			if( this.state === 'RESOLVED' ){
				message+= 'was resolved after ' + this.duration +  'ms with ' + this.result;
			}
			else{
				message+= 'was rejected after ' + this.duration + 'ms with ' + this.result;
			}

			throw this.createError(message);
		}
	}
});

var WillResolve = WillSettle.define('willResolve', {
	check(value){
		this.super.check.call(this, value);
		if( this.state === 'REJECTED' ){
			throw this.createError('thenable must resolve but was rejected with ' + this.result);
		}
	}
});

var WillReject = WillSettle.define('willReject', {
	check(value){
		this.super.check.call(this, value);
		if( this.state === 'RESOLVED' ){
			throw this.createError('thenable must reject but was resolved with ' + this.result);
		}
	}
});

var WillBePendingIn = WillBePending.define('willBePendingIn', {
	constructor: api(
		'constructor',
		[{type: 'number', default: 100}],
		function(mustBePendingAfterThisAmountOfMs){
			if( mustBePendingAfterThisAmountOfMs !== 100 ){
				// must set a new timeout
			}
		}
	)
});

var willSettleIn = WillSettle.define('willSettleIn', {
	constructor: api(
		'constructor',
		[{type: 'number'}, {type: 'number', default(expectedDuration){ return expectedDuration * 0.3 + 5; }}],
		function(expectedDuration, acceptableDurationDifference){
			this.super.constructor.apply(this, arguments);

			// make timeout be expectDuration + acceptableDifference
			// this.timeout.set(expectedDuration + acceptableDurationDifference);
		}
	),

	check(expectedDuration, acceptableDurationDifference){
		// ensure it has settled
		this.super.check.apply(this, arguments);

		var duration = this.duration;
		var diff = duration - expectedDuration;

		if( Math.abs(diff) > acceptableDurationDifference ){
			var message;

			if( acceptableDurationDifference === 0 ){
				message = 'thenable must take ' + expectedDuration + ' ms to settle';
			}
			else{
				var min = expectedDuration - acceptableDurationDifference;
				var max = expectedDuration + acceptableDurationDifference;

				message = 'thenable must take between ' + min + 'ms and ' + max + ' ms to settle';
			}

			if( this.state === 'RESOLVED' ){
				message+= ' but has resolved in ' + duration + ' ms with ' + this.result;
			}
			else{
				message+= ' but has rejected in ' + duration + ' ms with ' + this.result;
			}

			throw this.createError(message);
		}
	}
});

var WillResolveWith = WillResolve.define('willResolveWith', {
	check(value, expectedResolutionValue){
		this.super.check.call(this, value);
		Match.check.call(this, this.result, expectedResolutionValue);
	}
});

var WillRejectWith = WillReject.define('willRejectWith', {
	check(value, expectedRejectionValue){
		this.super.check.call(this, value);
		Match.check.call(this, this.result, expectedRejectionValue);
	}
});

export default Assertion;

export const test = {
	modules: ['node/assert'],
	suite(add, assert){

		function assertReject(thenable, condition){
			thenable.then(
				function(){
					assert.fail('thenable has resolved');
				},
				function(rejectionValue){
					if( false === condition(rejectionValue) ){
						assert.fail('thenable reject with unexpected value ' + rejectionValue);
					}
				}
			);
		}

		add("expect must have exactly 1 argument", function(){
			assert.throws(
				function(){
					expect();
				},
				function(e){
					return e.name === 'SignatureError' && e.message === "expect arguments length must be 1 (got 0)";
				}
			);

			assert.throws(
				function(){
					expect(10, 12);
				},
				function(e){
					return e.name === 'SignatureError' && e.message === "expect arguments length must be 1 (got 2)";
				}
			);
		});

		add("match", function(){
			assert.throws(
				function(){
					expect(10).match(9);
				},
				function(e){
					return e.name === 'AssertionError' && e.message === "value must be 9 (got 10)";
				}
			);
		});

		add("willResolve", function(){
			assert.throws(
				function(){
					expect(10).willResolve();
				},
				function(e){
					return e.name === 'AssertionError' && e.message === 'willResolve value must be thenable';
				}
			);

			assertReject(
				expect(Promise.reject()).willResolve(),
				function(e){
					return e.name === 'AssertionError' && e.message === 'thenable must resolve but was rejected with undefined';
				}
			);

			// we must not create a new error stack, the TypeError stack is more relevant than assertion error stack
			// theses errors are unexpected error that make assertion fails so TypeError is not transformed into an AssertionError
			// the error fileName & lineNumber correspond to the place TypeError was thrown
			// it's a MAJOR feature that helps to track errors
			var trace = platform.trace();
			assertReject(
				expect(Promise.reject(new TypeError('foo'))).willResolve(),
				function(e){
					return e.name === 'TypeError' && e.message === 'foo' && e.fileName === trace.fileName && e.lineNumber && trace.lineNumber + 2;
				}
			);
		});

		add("willResolveWith", function(){
			assertReject(
				expect(Promise.resolve(10)).willResolveWith(9),
				function(e){
					return e.name === 'AssertionError' && e.message === 'value must be 9 (got 10)';
				}
			);
		});

		add("willTake", function(){
			// by default acceptableDurationDifference is 50*0.3+5 hence the between 32ms and 68ms
			assertReject(
				expect(Promise.resolve()).willTake(50),
				function(e){
					return e.name === 'AssertionError' && e.message.match(/thenable must take between 32ms and 68ms to settle but was resolved in \d+ms with undefined/);
				}
			);

			assertReject(
				expect(Promise.reject()).willTake(50, 10),
				function(e){
					return e.name === 'AssertionError' && e.message.match(/thenable must take between 40ms and 60ms to settle but was rejected in \d+ms with undefined/);
				}
			);

			assertReject(
				expect(new Promise(function(){})).willTake(200, 5),
				function(e){
					return e.name === 'AssertionError' && e.message === 'thenable must settle in less than 205ms but is still pending';
				}
			);
		});

		add("implicit timeout on thenable", function(){
			assertReject(
				expect(new Promise(function(){})).willResolve(),
				function(e){
					return e.name === 'AssertionError' && e.message == 'thenable must settle in less than 100ms but is still pending';
				}
			);
		});

		add("custom timeout", function(){
			var expectation = expect(new Promise(function(){}));

			expectation.timeout.set(200);

			assertReject(
				expectation,
				function(e){
					return e.name === 'AssertionError' && e.message === 'thenable must settle in less than 200ms';
				}
			);
		});

	}
};

/*
var error;
// when rejected with an error, keep error object intact to get stack trace
if( rejectionValue instanceof Error ){
	error = rejectionValue;
	error.message = 'rejected with error ' + rejectionValue;
}
else{
	error = this.createError('rejected with ' + rejectionValue);
}
*/

/*

createError(message){
	return new AssertionError(this.type, message);
},
*/

/*
called(){
	// ensure value is a spy
	// ensure spy state is not pending
},

returned(){

},

threw(){

},

calledWith(){

},

returnedWith(){

},

threwWith(){

},

calledOn(){

},

willBeCalled(){

},

willReturn(){

},

willThrow(){

},

willBeCalledWith(){

},

willReturnWith(){

},

willThrowWith(){

},

willBecalledOn(){

}
*/

/*
var expect = api(
	function expect(value){
		return AssertionList.create(value);
	}
);
*/