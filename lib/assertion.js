// all assertion should be async

import proto from 'proto';

import Timeout from '../node_modules/@dmail/timeout/index.js';
import Thenable from '../node_module/@dmail/thenable/index.js';

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

var Assertion = proto.extend({
	type: undefined,
	state: 'created',
	// returnValue: undefined // au lieu de result
	result: undefined,
	failed: false,
	passed: false,
	timeoutDuration: 100,

	constructor: function Assertion(){
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
		if( this.state === 'created' ){
			this.failed = true;
			this.reason = reason;
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
		}
	},

	pass(reason){
		if( this.state === 'created' ){
			this.passed = true;
			if( reason ){
				this.state = reason;
			}
			else{
				this.state = 'passed';
			}

			this.resolve(this);
		}
	},

	expire(){
		this.state = 'timedout';
		this.fail(this.timeout.value);
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
			this.fail('error');
			this.result = error;
			return this;
		}
		else if( Thenable.is(returnValue) ){
			var returnValuePromise = returnValue;

			returnValuePromise = Thenable.after(returnValuePromise, function(value, resolved){
				if( resolved ){
					this.pass(value);
				}
				else{
					this.fail(value); // ceci empâche checkPromise de fail, enfin non
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
		}

		return this;
	}
});

export default Assertion;