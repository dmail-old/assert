import proto from 'proto';

import Thenable from '../node_module/@dmail/thenable/index.js';
import Iterable from '../node_module/@dmail/iterable/index.js';

import assert from './assert.js';

/*
	Expectation let you assert many things and figure after if and what failed
*/

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

var Expectation = proto.extend({
	collectFailures: false, // true or false

	constructor: function Expectation(value){
		if( arguments.length === 0 ){
			throw new Error('Expectation value is missing');
		}

		this.assertions = [];
		this.value = value;
		//this.current = null;

		this.promise = new Promise(function(resolve, reject){});
	},

	findAssertionBySignature(type){
		var args = arguments;

		return this.assertions.find(function(assertion){
			if( assertion.type != type ) return false;
			return Array.prototype.slice.call(assertion.args, 1).every(function(arg, index){
				return arg == args[index];
			}, this);
		}, this);
	},

	expect(expectedResolutionValue){
		// this function is responsible to make all the assertions
		// you have to call done after it

		this.assert('isThenable');
		this.assert('willResolve');
		this.assert('resolveMatch', expectedResolutionValue);
		this.done();

		// this.expect(Promise.resolve).is('thenable').willResolve();
	},

	assert(){
		var assertion, args = [this.value].concat(Array.prototype.slice.call(arguments));

		// check if there is already an assertion with same type & arguments
		assertion = this.findAssertionBySignature.apply(this, args);

		if( !assertion ){
			assertion = assert.apply(this, args);

			if( false === this.collectFailures && this.firstFailed ){
				// do not exec the assertion we've already failed
			}
			else{
				assertion.exec();
			}

			//this.current = assertion;

			// quand l'assertion en cours se termine fait la suivante, je préfère écrire un then
			// moi même dans expect() en fait
			/*
			if( Thenable.is(this.current) ){
				this.current.then(function(){


				});
			}
			*/

			this.assertions.push(assertion);
		}

		return assertion;
	},

	// return a promise that will resolve to undefined when all assertion are ready
	// or when an assertion fails
	/*
	execSerie(){
		var iterator = this.assertions[Symbol.iterator](), next, assertion;

		function nextAssertion(){
			next = iterator.next();

			if( next.done ){
				return undefined;
			}

			assertion = next.value;

			return Promise.resolve(assertion).then(function(){
				if( false === this.collectFailures && assertion.failed ){
					return;
				}
				return nextAssertion();
			});
		}

		return Promise.resolve(nextAssertion());
	},
	*/

	get sync(){
		return this.assertions.every(function(assertion){
			return false === Thenable.is(assertion);
		});
	},

	get firstFailed(){
		return this.assertions.find(function(assertion){
			return assertion.failed;
		});
	},

	get valid(){
		return this.assertions.every(function(assertion){
			return assertion.passed;
		});
	}
});

export default Expectation;