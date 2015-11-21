import proto from 'proto';

function getTypeName(value){
	var name;

	if( value === null ){
		name = 'null';
	}
	else if( value === undefined ){
		name = 'undefined';
	}
	else{
		name = value.constructor.name;

		if( name === 'constructor' || name == 'undefined' || name === '' ){
			if( proto.type in value ){
				name = value[proto.type];
			}
			else{
				name = 'Object';
			}
		}
	}

	return name;
}

export default getTypeName;