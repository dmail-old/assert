import API from '../lib/api/api.js';

import assert from 'node/assert';

export default function(){

	assert.throws(function(){
		API.create();
	}, Error);

	assert.throws(function(){
		API.create(10);
	}, TypeError);

	var callProperties = {};
	var apiMethod = API.create(function(){
		callProperties.this = this;
		callProperties.args = Array.prototype.slice.call(arguments);
	});
	var myCallProperties = {
		this: 'foo',
		args: [0, 1]
	};

	apiMethod.apply(myCallProperties.this, myCallProperties.args);
	assert.deepEqual(callProperties, myCallProperties);

}