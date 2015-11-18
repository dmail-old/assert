import proto from 'proto';

import Thenable from '../node_module/@dmail/thenable/index.js';
import Iterable from '../node_module/@dmail/iterable/index.js';

import assert from './assert.js';

/*

ValidityState help to manage a group of assertion

*/

var ValidityState = proto.extend({
	constructor: function CallValidityState(){
		this.assertions = [];
	},

	assert(){
		var assertion = assert.apply(this, arguments);

		assertion.exec();

		this.assertions.push(assertion);

		return assertion;
	},

	// returns a promise that will resolve to undefined
	// when an assertion fails or when all assertion are passed
	// each assertion waits for the previous one
	firstFailed(){
		var iterator = this.assertions[Symbol.iterator](), next, assertion;

		function nextAssertion(){
			next = iterator.next();

			if( next.done ){
				return undefined;
			}

			assertion = next.value;

			return Promise.resolve(assertion).then(function(){
				if( assertion.failed ){
					return;
				}
				return nextAssertion();
			});
		}

		return Promise.resolve(nextAssertion());
	},

	/*
	This method is commented because executing assertions in parallel
	And resolving to the first failed assertion would lead to race conditions later
	-> because the remaining assertion are still going to pass/fail after the returned promise resolve
	*/

	/*
	// return a promise that will resolve to undefined
	// when an assertion fails or when all assertion are passed
	anyFailed(){
		return Promise.race([
			// if an assertion fails, stop there
			new Promise(function(resolve){
				this.assertions.forEach(function(assertion){
					Promise.resolve(assertion).then(function(){
						if( assertion.failed ){
							resolve();
						}
					});
				});
			}.bind(this)),
			Promise.all(this.assertions)
		]);
	},
	*/

	// returns a promise that will resolve to undefined when all assertions are passed or failed
	ready(){
		return Promise.all(this.assertions);
	},

	get valid(){
		return this.assertions.every(function(assertion){
			return assertion.passed;
		});
	}
});

export default ValidityState;