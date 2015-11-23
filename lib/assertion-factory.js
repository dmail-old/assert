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

	set(assertion){
		this.assertions[assertion.type] = assertion;
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

export default AssertionFactory;