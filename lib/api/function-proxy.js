import proto from 'proto';

var FunctionProxy = proto.extend({
	[proto.type]: 'FunctionProxy',

	constructor(originalFunction){
		if( arguments.length === 0 ){
			throw new Error('FunctionProxy method argument missing');
		}
		else if( typeof originalFunction != 'function' ){
			throw new Error('FunctionProxy first argument must be a function');
		}

		this.originalFunction = originalFunction;
		this.params = Array.prototype.slice.call(arguments, 1).map(this.createParam, this);
	},

	createParam(parameter){
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

		return parameterProperties;
	},

	matchValues(values){
		return this.params.every(function(param, index){
			if( false === 'type' in param ) return true;
			// check if values[index] type match param.type
			return false;
		});
	},

	match(){
		return this.matchValues(arguments);
	},

	apply(thisValue, argumentValues){
		if( this.matchValues(argumentValues) ){
			this.originalFunction.apply(thisValue, argumentValues);
		}
		else{
			// throw an error depending on what has failed
		}
	},

	call(thisValue){
		return this.apply(thisValue, Array.prototype.slice.call(arguments, 1));
	},

	toMethod(){

	}
});

// API + polymorph
var FunctionProxy;

FunctionProxy.create(); // throw 'typeError API method missing'
FunctionProxy.create(function(){}); // returns a function calling original function
FunctionProxy.create(function(){}, 'a', 'b'); // set argument names to 'a' & 'b'
FunctionProxy.create(function(){}, Number, String); // force argument 0 to be a Number & 1 to be a String
FunctionProxy.create(function(){}, Number, '...'); // let argument 1 to ... to be anything
FunctionProxy.create(function(){}, {value: 10}, {value: 'a'}); // set default value for arguments
FunctionProxy.expectedThis = null;

// I want something like

var ServeFunctionProxy = FunctionProxy.extend({

});

var ServeAPI;

ServeAPI(
	'POST', // the request method must be post
	function(){

	},

	{method: 'GET'}, // the request method must be get
	function(){

	}
);
