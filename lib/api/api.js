import proto from 'proto';

import CallSignature from './call-signature.js';

var API = proto.extend({
	[proto.type]: 'API',

	constructor(method, thisSchema, argumentSchemas){
		if( arguments.length === 0 ){
			throw new Error('API method missing');
		}
		if( typeof method != 'function' ){
			throw new TypeError('API method must be a function');
		}

		var signature = CallSignature.create.apply(CallSignature, Array.prototype.slice.call(arguments, 1));
		var self = this;
		var fn = function(){
			var callProperties = {
				this: this,
				args: arguments
			};

			// will throw if the call is invalid
			signature.sign(callProperties);

			return method.apply(callProperties.this, callProperties.args);
		};

		// prototype properties
		/*
		Object.getOwnPropertyNames(this.constructor).forEach(function(name){
			Object.defineProperty(fn, name, Object.getOwnPropertyDescriptor(this.constructor, name));
		}, this);
		// instance properties
		Object.getOwnPropertyNames(this).forEach(function(name){
			Object.defineProperty(fn, name, Object.getOwnPropertyDescriptor(this, name));
		}, this);
		*/

		return fn;
	}
});

export default API;