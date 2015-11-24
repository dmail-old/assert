import proto from 'proto';

import getTypeName from '../get-type.js';

function createInvalidValueError(actual, expected){
	var error = new TypeError('INVALID_VALUE: value must be ' + expected + ' and got ' + actual);
	error.actual = actual;
	error.expected = expected;
	error.code = 'INVALID_VALUE';
	return error;
}

var Schema = proto.extend({
	[proto.type]: 'Schema',

	nameProperties: {
		"thenable": {
			"type": "thenable"
		},
		"iterable": {
			"type": "iterable"
		}
	},

	constructor(value){
		var properties;

		if( typeof value === 'string' ){
			properties = {
				name: value
			};
		}
		else if( value === undefined || value === null ){
			properties = {};
		}
		else if( value === Object ){
			properties = {
				type: Object
			};
		}
		else if( Object.getPrototypeOf(value) === Object.prototype ){
			properties = value;
		}
		else{
			properties = {
				type: value
			};
		}

		this.properties = properties;

		if( this.has('name') ){
			var name = this.get('name');
			var nameProperties = this.nameProperties;

			if( name in nameProperties ){
				Object.assign(this.properties, nameProperties[name]);
			}
		}
	},

	has(name){
		return name in this.properties;
	},

	get(name){
		return this.properties[name];
	},

	getValue(dependencyValues){
		var value;

		if( this.has('value') ){
			value = this.get('value');
			if( typeof value === 'function' ){
				if( dependencyValues ){
					value = value.apply(this, dependencyValues);
				}
				else{
					value = value();
				}
			}
		}

		return value;
	},

	check(value){
		if( this.has('type') ){
			var type = getTypeName(this.get('type'));
			var valueType = getTypeName(value);

			if( type != valueType ){
				throw createInvalidValueError(valueType, type);
			}
		}
	}
});

function SignatureError(message){
	var error = new Error(message || 'failed signature');

	error.constructor = SignatureError;
	error.name = error.constructor.name;

	return error;
}

function createNotEnoughArgumentError(actual, expected){
	var error = new SignatureError('NOT_ENOUGH_ARGUMENT: signature expect ' + expected + ' arguments, ' + actual + ' given');
	error.code = 'NOT_ENOUGH_ARGUMENT';
	return error;
}

function createTooMuchArgumentError(actual, expected){
	var error = new SignatureError('TOO_MUCH_ARGUMENT: signature expect ' + expected + ' arguments, ' + actual + '  given');
	error.code = 'TOO_MUCH_ARGUMENT';
	return error;
}

function createInvalidArgumentError(actual, expected, index){
	var error = new SignatureError('INVALID_ARGUMENT: signature expect ' + expected + ' value, ' + actual + ' given');
	error.code = 'INVALID_ARGUMENT';
	return error;
}

function createInvalidThisError(actual, expected){
	var error = new SignatureError('INVALID_THIS: signature expect this ' + expected + ' value, ' + actual + ' given');
	error.code = 'INVALID_THIS';
	return error;
}

function createMissingThisError(){

}

var CallSignature = proto.extend({
	[proto.type]: 'CallSignature',
	thisSchema: undefined,
	argumentSchemas: [],

	constructor(thisSchema, argumentSchemas){
		if( arguments.length > 0 ){
			this.thisSchema = Schema.create(thisSchema);
			if( arguments.length > 1 ){
				if( !argumentSchemas || typeof argumentSchemas.forEach != 'function' ){
					throw new TypeError('argumentSchemas has no forEach method');
				}
				argumentSchemas.forEach(this.setArgumentSchema, this);
			}
		}
	},

	setArgumentSchema(properties, index){
		if( false === this.hasOwnProperty('argumentSchemas') ){
			this.argumentSchemas = [];
		}
		if( arguments.length === 1 ){
			index = this.argumentSchemas.length;
		}

		this.argumentSchemas[index] = Schema.create(properties);
	},

	signThis(thisValue){
		var thisSchema = this.thisSchema;

		if( thisSchema ){
			if( thisValue === undefined ){
				thisValue = thisSchema.getValue();
			}

			try{
				thisSchema.check(thisValue);
			}
			catch(e){
				throw createInvalidThisError(e.actual, e.expected);
			}
		}

		return thisValue;
	},

	signArguments(argumentValues){
		var argumentSchemas = this.argumentSchemas;
		var argumentLength = argumentValues.length;
		var i = 0, j = argumentSchemas.length, argumentValue, argumentSchema, signedArgs;

		if( j === 0 ){
			signedArgs = argumentValues;
		}
		else{
			signedArgs = [];

			var hasRestParam = false;

			for(;i<j;i++){
				argumentSchema = argumentSchemas[i];

				if( i === j - 1 && argumentSchema.get('name') === '...' ){
					// faut ajouter tous les arguments suivants et on a fini
					signedArgs.push.apply(signedArgs, argumentValues.slice(i));
					hasRestParam = true;
					j--;
					break;
				}
				if( i < argumentLength ){
					argumentValue = argumentValues[i];
					signedArgs[i] = argumentValue;
				}
				else{
					if( argumentSchema.has('value') ){
						argumentValue = argumentSchema.getValue(signedArgs);
						signedArgs[i] = argumentValue;
					}
				}

				try{
					argumentSchema.check(argumentValue);
				}
				catch(e){
					throw createInvalidArgumentError(e.actual, e.expected, i);
				}
			}

			var signedLength = signedArgs.length;
			var hasLessArgument = signedLength < j;

			if( hasLessArgument ){
				throw createNotEnoughArgumentError(argumentLength, j);
			}

			var hasMoreArgument = signedLength > j;
			if( false === hasRestParam && hasMoreArgument ){
				throw createTooMuchArgumentError(argumentLength, j);
			}
		}

		return signedArgs;
	},

	// sign the call with this signature, it can fail if throw error if arguments or this has not the right signature
	sign(call){

		call.this = this.signThis(call.this);
		call.args = this.signArguments(call.args);

		return call;
	},

	testArguments(argumentValues){
		try{
			this.signArguments(argumentValues);
			return true;
		}
		catch(e){
			if( e.name === 'SignatureError' ){
				return false;
			}
			throw e;
		}
	}
});

export default CallSignature;