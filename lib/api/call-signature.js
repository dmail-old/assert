import proto from 'proto';

import getTypeName from './get-type.js';

function createNotEnoughArgumentError(actual, expected){
	var error = new TypeError('NOT_ENOUGH_ARGUMENT: signature expect ' + expected + ' arguments, ' + actual + ' given');
	error.code = 'NOT_ENOUGH_ARGUMENT';
	return error;
}

function createTooMuchArgumentError(actual, expected){
	var error = new TypeError('TOO_MUCH_ARGUMENT: signature expect ' + expected + ' arguments, ' + actual + '  given');
	error.code = 'TOO_MUCH_ARGUMENT';
	return error;
}

function createInvalidArgumentError(actual, expected){
	var error = new TypeError('INVALID_ARGUMENT: signature expect ' + expected + ' value, ' + actual + ' given');
	error.code = 'INVALID_ARGUMENT';
	return error;
}

var CallSignature = proto.extend({
	[proto.type]: 'CallSignature',
	params: [],
	expectedThisType: undefined,
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
		this.params = [];
		Array.prototype.forEach.call(arguments, this.setParam, this);
	},

	setParam(parameter){
		var parameterProperties;

		if( typeof parameter === 'string' ){
			parameterProperties = {
				name: parameter
			};
		}
		else if( Object.getPrototypeof(parameter) === Object.prototype ){
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

		return parameterProperties;
	},

	signThis(thisValue){
		if( thisValue === undefined ){
			thisValue = this.thisValue;
		}

		if( this.hasOwnProperty('expectedThisType')	){
			var thisValueType = getTypeName(thisValue);
			var expectedThisType = this.expectedThisType;

			if( thisValueType != expectedThisType ){
				throw new TypeError('this type must be ' + expectedThisType);
			}
		}

		return thisValue;
	},

	signArguments(argumentValues){
		var params = this.params, paramsLength = params.length, argumentLength = argumentValues.length;
		
		if( argumentLength < paramsLength ){
			throw createNotEnoughArgumentError(argumentLength, paramsLength);
		}

		var restParam = paramsLength < 0 && params[paramsLength - 1].name === '...';
		if( false === restParam && argumentLength > paramsLength ){
			throw createTooMuchArgumentError(argumentLength, paramsLength);
		}

		var args = [], i = 0, j = params.length, argumentValue, param;

		for(;i<j;i++){
			param = params[i];

			// get the value from param.value
			if( argumentLength < i ){
				argumentValue = param.value;
				if( typeof argumentValue === 'function' ){
					argumentValue = argumentValue.apply(this, args);
				}
			}
			else{
				argumentValue = argumentValues[i];
			}

			if( 'type' in param ){
				var argumentValueType = getTypeName(argumentValue);
				var paramType = param.type;

				if( argumentValueType != paramType ){
					throw createInvalidArgumentError(argumentValueType, paramType);
				}				
			}

			args.push(argumentValue);
		}

		return args;
	},

	// sign the call with this signature, it can fail if throw error if arguments or this has not the right signature 
	sign(call){

		call.thisValue = this.signThis(call.thisValue);
		call.args = this.signArguments(call.args);

		return call;
	}
});

export default CallSignature;