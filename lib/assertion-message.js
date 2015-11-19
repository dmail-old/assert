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

function createFailedResolveWitAssertionMessage(resolveWithAssertion){
	var failedAssertion = resolveWithAssertion.firstFailed;

	if( failedAssertion.type == 'is' ){
		return createFailedAssertionMessage(failedAssertion);
	}
	else if( failedAssertion.type === 'resolve' ){
		return 'thenable has rejected with ' + failedAssertion.returnValue + ' but was expecting to resolve with' + resolveWithAssertion.expected;
	}
	else if( failedAssertion.type === 'resolveMatch' ){
		return 'thenable has resolved but ' + result.message;
	}
}

function createFailedResolveInAssertionMessage(){
	if( this.reason === 'TOO_SLOW' ){
		'resolving took much time than expected (+' + diff  + 'ms)';
	}
	else if( this.reason === 'TOO_FAST' ){
		'resolving took less time than expected (-' + -diff  + 'ms)';
	}
}

