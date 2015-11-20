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
	type: undefined,
	isValid: undefined,
	timeoutDuration: 100,
	returnValue: undefined, // value returned by assertion method
	errorValue: undefined, // error create by assertion method
	thenableIsResolved: undefined, // when assertion method returns a thenable, state of the thenable
	thenableValue: undefined, // when assertion methods returns a thenable, value of the thenable
	assertions: [],

	constructor: function Assertion(){
		this.args = arguments;

		if( arguments.length === 0 ){
			this.fail('NOT_ENOUGH_ARGUMENT');
		}
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

	isPending(){
		return this.state === 'created';
	},

	setState(valid, state){
		if( this.isPending() ){
			this.state = state;

			if( valid ){
				this.isValid = true;
			}
			else{
				this.isValid = false;
			}

			if( this.resolve ){
				this.resolve(this);
			}
		}
	},

	fail(state){
		return this.setState(false, state);
	},

	pass(state){
		return this.setState(true, state);
	},

	expire(){
		this.fail('TIMEOUT');
	},

	error(error){
		if( this.isPending() ){
			this.errorValue = error;
			this.fail('ERROR');
		}
	},

	get value(){
		return this.args[0];
	},

	get duration(){
		return this.endDate ? this.endDate - this.startDate : 0;
	},

	get sync(){
		return false === Thenable.is(this.returnValue);
	},

	get failed(){
		return this.isValid === true;
	},

	get passed(){
		return this.isValid === false;
	},

	adoptState(otherAssertion){
		// only if it fails
		if( otherAssertion.failed ){
			this.fail(otherAssertion.state);
		}
		/*
		else{
			this.pass(otherAssertion.state);
		}
		*/
	},

	become(otherAssertion){
		otherAssertion.exec();

		if( otherAssertion.sync ){
			this.adoptState(otherAssertion);
		}
		else{
			this.then(function(){
				this.adoptState(otherAssertion);
			}.bind(this));
		}
	},

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
			this.error(error);
		}
		else{
			this.returnValue = returnValue;

			if( Thenable.is(returnValue) ){
				var returnValuePromise = returnValue;

				returnValuePromise = Thenable.after(returnValuePromise, function(value, resolved){
					this.thenableValue = value;
					this.thenableIsResolved = resolved;

					if( resolved ){
						this.pass();
					}
					else if( value instanceof Error ){
						this.error();
					}
					else{
						this.fail();
					}
				}, this);

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
			else if( this.isPending() ){
				throw new Error('assertion exec() did not call fail() or pass()');
			}
			else{
				// assertion state is known, all is ok
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