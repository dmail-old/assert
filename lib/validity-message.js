function prefixWithArticle(noun){
	var firstChar = noun[0].toLowerCase();
	var prefix;

	if( ['a', 'e', 'i', 'o', 'u'].indexOf(firstChar) > -1 ){
		prefix = 'an';
	}
	else{
		prefix = 'a';
	}

	return prefix + ' ' + noun;
}

function createFailedTypeAssertionMessage(actualType, expectedType){
	var message = '';

	message+= ' got ';
	if( actualType === 'null' || actualType === 'undefined' ){
		message+= actualType;
	}
	else{
		message+= prefixWithArticle(actualType);
	}

	message+= 'but ';
	if( expectedType === 'null' || expectedType === 'undefined' ){
		message+= expectedType;
	}
	else{
		message+= prefixWithArticle(expectedType);
	}
	message+= 'was expected';

	return message;
}

function createFailedAssertionMessage(assertion){

}

function createFailedMatchAssertionMessage(matchAssertion){
	var message;

	if( matchAssertion.reason === 'mismatch' ){
		// si on est dans le cas où on check les différences
		if( false ){
			var failedAssertions = matchAssertion.failedAssertions;
			var length = failedAssertions.length;

			if( length === 1 ){
				message = createFailedAssertionMessage(failedAssertions[0]);
			}
			else{
				if( matchAssertion.failedAssertionOverflow ){
					message = 'actual hasat least ' + length + ' differences with expected : ';
				}
				else{
					message = 'actual has ' + length + ' differences with expected : ';
				}

				message+= failedAssertions.map(function(failedAssertion){
					return createFailedAssertionMessage(failedAssertion);
				}).join(', ');
			}
		}
	}
}