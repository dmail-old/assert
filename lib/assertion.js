// all assertion should be async

import proto from 'proto';

import Timeout from '../node_modules/@dmail/timeout/index.js';
import Thenable from '../node_module/@dmail/thenable/index.js';

import isCircular from './is-circular.js';

var Assertion = proto.extend({
	type: undefined,
	state: 'created',
	// returnValue: undefined // au lieu de result
	result: undefined,
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

	fail(value){
		if( this.isPending() ){
			this.failed = true;
			if( arguments.length > 0 ){
				this.returnvalue = value;
			}
			this.state = 'failed';

			this.resolve(this);
		}
	},

	pass(value){
		if( this.isPending() ){
			this.passed = true;
			if( arguments.length > 0 ){
				this.returnvalue = value;
			}
			this.state = 'passed';

			this.resolve(this);
		}
	},

	expire(){
		if( this.isPending() ){
			this.reason = 'timeout';
			this.fail();
		}
	},

	error(error){
		if( this.isPending ){
			this.reason = 'error';
			this.errorValue = error;
			this.fail();
		}
	},

	get duration(){
		return this.endDate ? this.endDate - this.startDate : 0;
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
		else if( Thenable.is(returnValue) ){
			var returnValuePromise = returnValue;

			returnValuePromise = Thenable.after(returnValuePromise, function(value, resolved){
				if( resolved ){
					this.pass(value);
				}
				else if( value instanceof Error ){
					this.error(value);
				}
				else{
					this.fail(value);
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
		else{
			// check is responsible to call fail(), pass()
			this.returnValue = returnValue;
		}

		return this;
	}
});

export default Assertion;