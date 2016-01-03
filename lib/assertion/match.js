import proto from 'proto';

import Assertion from '../assertion.js';

import Validate from './validate.js';

function createDefinition(value){
	var definition = {};
	
	if( proto.isOfKind(value, 'regexp') ){
		definition.pattern = value;
	}
	else if( proto.isOfKind(value, 'string') ){
		definition.contains = value;
	}
	else{
		definition.kind = proto.kindOf(value);

		if( proto.isOfKind(value, 'object') ){
			var properties = {};

			Object.keys(value).forEach(function(key){
				properties[key] = createDefinition(value[key]);
			});
		}
	}	

	return definition;
}

var Match = Assertion.define(
	'match',
	function(actual, expected){
		return Validate.create(actual, createDefinition(expected)).exec();
	}
);

export default Match;