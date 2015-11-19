import Assertion from './assertion.js';

var AssertionFactory = {
	assertions: {},

	create(type){
 		var AssertionType = this.get(type), assertion;

 		assertion = AssertionType.create.apply(AssertionType, Array.prototype.slice.call(arguments, 1));
 		assertion.factory = this;

 		return assertion;
	},

	get(type){
		return this.assertions[type];
	},

	set(type, assertion){
		this.assertions[type] = assertion;
	},

	define(type, properties){
		var assertion = Assertion.extend(properties);

		assertion.type = type;

		return assertion;
	},

	register(type, properties){
		var assertion = this.define(type, properties);

		return this.set(type, assertion);
	},

	assert(){
		return this.create.apply(this, arguments);
	}
};

var Thenable;

function getTypeName(){

}

// match assertion available in match.js
var assertions = [
	function is(value, expectedType){
		this.expectedType = expectedType;
		this.actualType = getTypeName(value);

		if( this.actualType != this.expectedType ){
			this.fail();
		}
		else{
			this.pass();
		}
	},

	function isThenable(value){
		if( false === Thenable.is(value) ){
			this.fail();
		}
		else{
			this.pass();
		}
	},

	function resolve(thenable){
		return thenable.then(
			function(resolutionValue){
				this.pass(resolutionValue);
				return resolutionValue;
			}.bind(this),
			function(rejectionValue){
				this.fail(rejectionValue);
				return rejectionValue;
			}.bind(this)
		);
	},

	function reject(thenable){
		return thenable.then(
			function(resolutionValue){
				this.fail(resolutionValue);
				return resolutionValue;
			}.bind(this),
			function(rejectionValue){
				this.pass(rejectionValue);
				return rejectionValue;
			}.bind(this)
		);
	},

	function resolveDurationIs(thenable, expectedDuration, acceptableDifference){
		if( acceptableDifference == null ){
			acceptableDifference = expectedDuration * 0.3 + 5;
		}

		this.expectedDuration = expectedDuration;
		this.timeoutDuration = expectedDuration + acceptableDifference + expectedDuration * 0.5;

		return thenable.then(
			function(value){
				var duration = this.duration;
				var diff = duration - expectedDuration;

				if( Math.abs(diff) > acceptableDifference ){
					if( duration > expectedDuration ){
						this.reason = 'TOO_SLOW';
					}
					else{
						this.reason = 'TOO_FAST';
					}

					this.fail(value);
				}
				else{
					this.pass(value);
				}
			}.bind(this)
		);
	},

	function pendingAfterDuration(thenable, duration){
		duration = duration || 10;
		this.timeoutDuration = 0; // do not use a timeout, it's handled by the one below

		setTimeout(this.pass.bind(this), duration);
		return thenable.then(this.fail.bind(this));
	}
];

var expectations = [
	function resolveWith(expectedResolutionValue){
		this.assert('isThenable'); // it's more a typeError related to API
		return this.assert('resolve').then(function(){
			return this.value.then(function(resolutionValue){
				this.assert('match', resolutionValue, expectedResolutionValue);
			}.bind(this));
		}.bind(this));
	},

	function rejectWith(expectedRejectionValue){
		this.assert('isThenable'); // it's more a typeError related to method call
		return this.assert('reject').then(function(){
			return this.value.catch(function(rejectionValue){
				this.assert('match', rejectionValue, expectedRejectionValue);
			}.bind(this));
		});
	},

	function resolveIn(expectedDuration, acceptableDifference){
		this.assert('isThenable'); // it' smore a TypeError related to API
		return this.assert('resolveDurationIs', expectedDuration, acceptableDifference).then(function(){
			return this.assert('resolve');
		}.bind(this));
	},

	function willTimeout(duration){
		this.assert('isThenable'); // it' smore a TypeError related to API
		return this.assert('pendingAfterDuration', duration);
	}
];

export default AssertionFactory;