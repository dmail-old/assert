// all assertion should be async

import proto from 'proto';

import Timeout from '../node_modules/@dmail/timeout/index.js';
import Thenable from '../node_module/@dmail/thenable/index.js';

import isCircular from './is-circular.js';
import CallSignature from './api/call-signature.js';

var Assertion = proto.extend({
	[proto.type]: 'Assertion',

	type: undefined,
	isValid: undefined,
	timeoutDuration: 100,
	result: undefined, // value returned by assertion method or thenable returned by assertion method
	signature: null,
	params: undefined,

	constructor(){
		var params = this.params;

		// no params provided ? all arguments are accepted but check force the length to be the check method length
		if( params === undefined ){
			params = new Array(this.check.length);
		}

		this.signature = CallSignature.create.apply(CallSignature, params);
		this.signature.expectedThisType = 'Assertion';

		this.args = arguments;
		this.stack = new Error().stack; // want to know who is calling this assertion in case it fails

		this.callProperties = {
			thisValue: this,
			args: arguments
		};

		try{
			this.signature.sign(this.callProperties);
		}
		catch(e){
			// we know the assertion failed because the callsignature is invalid
			// it's still an expected error that makes the assertion fails
			// but the created message is the same for all assertion
			this.fail();
		}
	},

	/*
	related to signature API I suppose
	getParam(name){
		return this.args[this.names.indexOf(name)];
	},

	hasParam(name){
		return this.names.indexOf(name) <= this.args.length;
	},
	*/

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
		var callProperties = this.callProperties, returnValue, errored, error;

		try{
			returnValue = this.check.apply(callProperties.this, callProperties.args);
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

Object.defineProperty(Assertion, proto.type, {
	get(){
		return this.type[0].toUpperCase() + this.type.slice(1) + 'Assertion';
	}
});

export default Assertion;