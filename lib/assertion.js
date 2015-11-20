// all assertion should be async

import proto from 'proto';

import Timeout from '../node_modules/@dmail/timeout/index.js';
import Thenable from '../node_module/@dmail/thenable/index.js';

import isCircular from './is-circular.js';

var Assertion = proto.extend({
	type: undefined,
	state: 'created',
	returnValue: undefined, // value returned by assertion method
	errorValue: undefined, // error create by assertion method
	thenableIsResolved: undefined, // when assertion method returns a thenable, state of the thenable
	thenableValue: undefined, // when assertion methods returns a thenable, value of the thenable
	failed: false,
	passed: false,
	timeoutDuration: 100,

	constructor: function Assertion(value){
		this.value = value;
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

	isPending(){
		return this.state === 'created';
	},

	setState(valid, reason){
		if( this.isPending() ){
			if( valid ){
				this.passed = true;
				this.state = 'passed';
			}
			else{
				this.failed = true;
				this.state = 'failed';
			}

			if( arguments.length > 1 ){
				this.reason = reason;
			}

			if( this.resolve ){
				this.resolve(this);
			}
		}
	},

	fail(reason){
		return this.setState(false, reason);
	},

	pass(reason){
		return this.setState(true, reason);
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

	get duration(){
		return this.endDate ? this.endDate - this.startDate : 0;
	},

	get sync(){
		return false === Thenable.is(this.returnValue);
	},

	adoptState(otherAssertion){
		// i'm missing some stuff here

		if( otherAssertion.failed ){
			this.fail(otherAssertion.reason);
		}
		else{
			this.pass(otherAssertion.reason);
		}
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