// all assertion should be async

import proto from 'proto';

import Timeout from '../node_modules/@dmail/timeout/index.js';
import Thenable from '../node_module/@dmail/thenable/index.js';

import isCircular from './is-circular.js';

var Call = proto.extend({
	[proto.type]: 'Call',

	constructor(properties){
		Object.assign(this, properties);
	}
});

var Spy = proto.extend({
	[proto.type]: 'Spy',

	constructor(method){
		this.calls = [];
		this.method = method;
	},

	apply(thisValue, argValues){
		var returnValue, errored = false, error;

		if( this.method ){
			try{
				returnValue = this.method.apply(thisValue, argValues);
			}
			catch(e){
				errored = true;
				error = e;
			}
		}

		var callProperties = {
			thisValue: thisValue,
			argValues: argValues,
			returnValue: returnValue,
			stack: new Error().stack
		};

		if( errored ){
			callProperties.error = error;
		}

		var call = Call.create(callProperties);

		this.calls.push(call);

		return returnValue;
	},

	call(thisValue){
		return this.apply(thisValue, Array.prototype.slice.call(arguments, 1));
	},

	toFunction(){
		var self = this;
		var fn = function(){
			return self.apply(this, arguments);
		};

		// prototype properties
		Object.getOwnPropertyNames(this.constructor).forEach(function(name){
			Object.defineProperty(fn, name, Object.getOwnPropertyDescriptor(this.constructor, name));
		}, this);
		// instance properties
		Object.getOwnPropertyNames(this).forEach(function(name){
			Object.defineProperty(fn, name, Object.getOwnPropertyDescriptor(this, name));
		}, this);

		return fn;
	}
});

var Assertion = proto.extend({
	[proto.type]: 'Assertion',

	type: undefined,
	isValid: undefined,
	timeoutDuration: 100,
	result: undefined, // value returned by assertion method or thenable returned by assertion method

	constructor(){
		this.args = arguments;
		this.stack = new Error().stack; // want to know who is calling this assertion in case it fails

		// we can check right there if arguments length is ok
		// if arguments types is ok
		// and prefill arguments with values
		// however we have to make fail the assertion when assertion is not called with the right arguments
		// but we check arguments using assertions
		// egg or chick, what do we do first?
		// we could check argument lenght & type without using assertion
		// and make them fail immediatly

		this.args = this.params.map(function(){

		});
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

	getParam(name){
		return this.args[this.names.indexOf(name)];
	},

	hasParam(name){
		return this.names.indexOf(name) <= this.args.length;
	},

	/*
	assert(type){
		var AssertionType = this.assertions.find(function(assertion){
			return assertion.type === type;
		});

		if( !AssertionType ){
			throw new Error('assertion of type ' + type + ' not found');
		}

		var args = Array.prototype.slice.call(arguments, 1);
		var assertionType =  AssertionType.create.apply(AssertionType, args);

		assertionType.exec();

		this.become(assertionType);

		return assertionType;
	},
	*/

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

Object.defineProperty(Assertion, proto.type, {
	get(){
		return this.type[0].toUpperCase() + this.type.slice(1) + 'Assertion';
	}
});

export default Assertion;


/*

function foo(){

}

var spy = Spy.create(foo);

spy.expectArgumentLengthEquals();


*/