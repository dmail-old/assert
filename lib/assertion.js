// all assertion should be async, why?

/*

assertion will use api under the hood but assertion signature error will be assertion error and not signaturerrror
so we will catch signature error and transform them into assertion error
-> nope signatureError will remain what they are to make the distinction between signature & assertion error

the desired api is something like

expect(10).equals(10);
expect(Promise.resolve(10)).resolveWith(10);

expect(Spy.create()).willBeCalledWith([]).willBeCalledOn(undefined); // must return a promise for both assertions

expect may fail with signature error
each method of an expect() is an assertion which can fail with signature error
each assertion may fail sync or return a promise that may fail or will resolve to the assertion

l'api pourrait ptet plutôt s'écrire autrement un peu comme les schémas en mettant les assertion en first

assert.is('string')('foo');
assert.resolveWith(10)(Promise.resolve(10));
assert({
	type: 'string',
	enum: ['foo', 'bar']
});

c'est moins naturel et je vois pas trop comment l'implémenter

*/

import proto from 'proto';

import Timeout from '../node_modules/@dmail/timeout/index.js';
import Thenable from '../node_module/@dmail/thenable/index.js';
import api from '../node_modules/@dmail/api/index.js';

import isCircular from './is-circular.js';

function AssertionError(code, message){
	var error = new Error();

	error.constructor = AssertionError;
	error.name = error.constructor.name;
	error.code = code;
	error.message = message;

	return error;
}

/*
return this.createError('must timeout after ' + ms + ' but has resolved after' + new Date() - this.duration);

var error;
// when rejected with an error, keep error object intact to get stack trace
if( rejectionValue instanceof Error ){
	error = rejectionValue;
	error.message = 'rejected with error ' + rejectionValue;
}
else{
	error = this.createError('rejected with ' + rejectionValue);
}

this.fail(error);

var timeoutError = new Error();
		timeoutError.name = 'AssertionTimeout';
		timeoutError.message = 'assertion is too slow (more than ' + this.timeoutDuration + ' ms)';

*/

var Assertion = proto.extend('Assertion', {
	type: undefined,
	isValid: undefined,
	timeoutDuration: 100,
	state: undefined, // reason for failure/success: oneOf 'ERRORED', 'RETURNED', 'RESOLVED', 'REJECTED', 'TIMEDOUT'
	result: undefined, // value returned by assertion method or thenable returned by assertion method

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

	assert(){
		return this.create.apply(this, arguments).exec();
	},

	createError(message){
		return new AssertionError(this.type, message);
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

	setState(state, result){
		if( this.pending ){
			this.result = result;

			var passed = false;
			if( state === 'TIMEDOUT' ){
				if( this.timeoutExpected ){
					passed = true;
				}
				else{
					passed = false;
				}
			}
			else if( state === 'RESOLVED' ){
				if( this.timeoutExpected ){
					passed = false;
				}
				else{
					passed = true;
				}
			}
			else if( state === 'REJECTED' ){
				passed = false;
			}
			else if( state === 'ERRORED' ){
				passed = false;
			}

			this.isValid = passed;

			if( this.sync ){
				throw this;
			}
			else{
				this.reject(this);
			}
		}
	},

	expire(){
		this.setState('TIMEDOUT', this.timeoutDuration);
	},

	get value(){
		return this.args[0];
	},

	get duration(){
		return this.endDate ? this.endDate - this.startDate : 0;
	},

	get sync(){
		return false === this.hasOwnProperty('promise');
	},

	get async(){
		return this.hasOwnProperty('promise');
	},

	get pending(){
		return this.isValid === undefined;
	},

	get done(){
		return this.isValid !== undefined;
	},

	get failed(){
		return this.isValid === false;
	},

	get passed(){
		return this.isValid === true;
	},

	get message(){
		return this.createMessage.apply(this, this.args);
	},

	exec(){
		var returnValue, errored, error;

		try{
			returnValue = this.check.apply(this, this.args);
		}
		catch(e){
			errored = true;
			error = e;
		}

		if( errored ){
			this.setState('ERRORED', error);
		}
		else{
			if( Thenable.is(returnValue) ){
				var returnValuePromise = returnValuePromise.then(
					function(resolutionValue){
						this.setState('RESOLVED', resolutionValue);
					}.bind(this),
					function(rejectionValue){
						this.setState('REJECTED', rejectionValue);
					}.bind(this)
				);

				var explicitResultPromise = new Promise(function(resolve, reject){
					this.resolve = resolve;
					this.reject = reject;
				}.bind(this));

				var assertionReadyPromise = Promise.race([
					returnValuePromise,
					explicitResultPromise,
				]);

				this.timeout = Timeout.create(this.expire, this);
				this.timeout.set(this.timeoutDuration);

				this.startDate = new Date();
				assertionReadyPromise = Thenable.after(assertionReadyPromise, function(value, resolved){
					this.endDate = new Date();
				}, this);

				this.promise = assertionReadyPromise;
				this.then = function(onResolve, onReject){
					return this.promise.then(onResolve, onReject);
				};
				this.catch = function(onReject){
					return this.then(null, onReject);
				};
			}
			else{
				this.setState('RETURNED', returnValue);
			}
		}

		return this;
	}
});

export default Assertion;