import proto from 'proto';

import getTypeName from '../get-type.js';

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

function createInvalidArgumentError(actual, expected){
	var error = new SignatureError('INVALID_ARGUMENT: signature expect ' + expected + ' value, ' + actual + ' given');
	error.code = 'INVALID_ARGUMENT';
	return error;
}

var CallSignature = proto.extend({
	[proto.type]: 'CallSignature',
	params: [],
	expectedThis: undefined,
	thisValue: undefined,

	nameProperties: {
		"thenable": {
			"type": "thenable"
		},
		"iterable": {
			"type": "iterable"
		}
	},

	constructor(){
		if( arguments.length ){
			Array.prototype.forEach.call(arguments, this.setParam, this);
		}
	},

	setParam(parameter, index){
		var parameterProperties;

		if( typeof parameter === 'string' ){
			parameterProperties = {
				name: parameter
			};
		}
		else if( parameter === undefined || parameter === null ){
			parameterProperties = {};
		}
		else if( Object === parameter ){
			parameterProperties = {
				type: Object
			};
		}
		else if( Object.getPrototypeOf(parameter) === Object.prototype ){
			parameterProperties = parameter;
		}
		else{
			parameterProperties = {
				type: parameter
			};
		}

		if( 'name' in parameterProperties ){
			var name = parameterProperties.name;
			var nameProperties = this.nameProperties;

			if( name in nameProperties ){
				Object.assign(parameterProperties, nameProperties[name]);
			}
		}

		if( false === this.hasOwnProperty('params') ){
			this.params = [];
		}
		if( arguments.length === 1 ){
			index = this.params.length;
		}

		this.params[index] = parameterProperties;

		return parameterProperties;
	},

	signThis(thisValue){
		if( thisValue === undefined ){
			thisValue = this.thisValue;
		}

		if( this.hasOwnProperty('expectedThisType')	){
			var thisValueType = getTypeName(thisValue);
			var expectedThisType = getTypeName(this.expectedThis);

			if( thisValueType != expectedThisType ){
				throw new TypeError('this type must be ' + expectedThisType);
			}
		}

		return thisValue;
	},

	signArguments(argumentValues){
		var params = this.params, paramsLength = params.length, argumentLength = argumentValues.length;
		var i = 0, j = params.length, argumentValue, param, paramValue, signedArgs;

		if( j === 0 ){
			signedArgs = argumentValues;
		}
		else{
			signedArgs = [];

			var hasRestParam = false;

			for(;i<j;i++){
				param = params[i];

				if( i === j - 1 && param.name === '...' ){
					// faut ajouter tous les arguments suivants et on a fini
					signedArgs.push.apply(signedArgs, argumentValues.slice(i));
					hasRestParam = true;
					break;
				}
				// get the value from param.value
				if( i < argumentLength ){
					argumentValue = argumentValues[i];
					signedArgs[i] = argumentValue;
				}
				else if( 'value' in param ){
					paramValue = param.value;
					if( typeof paramValue === 'function' ){
						paramValue = paramValue.apply(this, signedArgs);
					}
					argumentValue = paramValue;
					signedArgs[i] = argumentValue;
				}
				else{
					// isn't it obvisouly an error? and can we break for createNotEnoughArgumentError ?
					// -> nope, let type in param do the check and fail later
				}

				if( 'type' in param ){
					var argumentValueType = getTypeName(argumentValue);
					var paramType = getTypeName(param.type);

					if( argumentValueType != paramType ){
						throw createInvalidArgumentError(argumentValueType, paramType);
					}
				}
			}

			var signedLength = signedArgs.length;
			var hasLessArgument;
			if( hasRestParam ){
				hasLessArgument = signedLength < (paramsLength - 1);
			}
			else{
				hasLessArgument = signedLength < paramsLength;
			}
			if( hasLessArgument ){
				throw createNotEnoughArgumentError(argumentLength, paramsLength);
			}

			var hasMoreArgument = signedLength > paramsLength;
			if( false === hasRestParam && hasMoreArgument ){
				throw createTooMuchArgumentError(argumentLength, paramsLength);
			}
		}

		return signedArgs;
	},

	// sign the call with this signature, it can fail if throw error if arguments or this has not the right signature
	sign(call){

		call.thisValue = this.signThis(call.thisValue);
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