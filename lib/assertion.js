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
import CallSignature from './api/call-signature.js';

var Assertion = proto.extend('Assertion', {
	type: undefined,
	isValid: undefined,
	timeoutDuration: 100,
	result: undefined, // value returned by assertion method or thenable returned by assertion method
	signature: null,
	params: undefined,

	constructor(){
		this.args = arguments;
		this.stack = new Error().stack; // want to know who is calling this assertion in case it fails
	},

	define(name, method, schema){
		return Assertion.extend({
			type: name,
			check: api(method, schema)
		});
	},

	assert(){
		return this.create.apply(this, arguments).exec();
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

	setState(valid, result){
		if( this.pending ){
			this.result = result;

			if( valid ){
				this.isValid = true;
			}
			else{
				this.isValid = false;

				// the failure is an assertion
				if( Assertion.isPrototypeOf(result) ){

				}
				// the failure is an error
				else if( result instanceof Error ){

				}
				// the failure is something else
				else{

				}

				if( this.sync ){
					throw this;
				}
				else{
					this.reject(this);
				}
			}
		}
	},

	createMessage(){
		return 'failed assertion';
	},

	fail(result){
		return this.setState(false, result);
	},

	pass(result){
		return this.setState(true, result);
	},

	expire(){
		this.fail('TIMEOUT');
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

	get pending(){
		return this.isValid === undefined;
	},

	get done(){
		return this.isValid !== undefined;
	},

	get failed(){
		return this.isValid === true;
	},

	get passed(){
		return this.isValid === false;
	},

	get errored(){
		return this.done && this.failed && false === Assertion.isPrototypeOf(this.result);
	},

	get failedAssertion(){
		if( this.failed ){
			if( Assertion.isPrototypeOf(this.result) ) return this.result;
			return this;
		}
		return null;
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
			this.fail(error);
		}
		else{
			if( Thenable.is(returnValue) ){
				var returnValuePromise = returnValuePromise.then(function(value){
					if( value === false ){
						this.fail(value);
					}
					else{
						this.pass(value);
					}
				}.bind(this), this.fail.bind(this));

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
			else if( returnValue === false ){
				this.fail(returnValue);				
			}
			else{
				this.pass(returnValue);
			}
		}

		return this;
	}
});

export default Assertion;