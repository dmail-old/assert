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

function createFailedTypeAssertionMessage(assertion){
	var actualType = assertion.actualType;
	var expectedType = assertion.expectedType;

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

function createFailedMatchAssertionMessage(matchAssertion){
	var message;

	if( matchAssertion.reason === 'DIFFERENT' ){
		return matchAssertion.value + ' different of ' + matchAssertion.args[1];
	}
	else if( matchAssertion.reason === 'DIFFERENT_VALUES' ){
		var failedMatchAssertions = matchAssertion.differences;
		var length = failedMatchAssertions.length;

		if( length === 1 ){
			message = createFailedMatchAssertionMessage(failedMatchAssertions[0]);
		}
		else{
			if( matchAssertion.failedAssertionOverflow ){
				message = 'actual has at least ' + length + ' differences with expected : ';
			}
			else{
				message = 'actual has ' + length + ' differences with expected : ';
			}

			message+= failedMatchAssertions.map(function(failedAssertion){
				return createFailedMatchAssertionMessage(failedAssertion);
			}).join(', ');
		}

		return message;
	}
	else if( matchAssertion.reason === 'DIFFERENT_TYPES' ){
		return createFailedTypeAssertionMessage(matchAssertion);
	}
	else if( matchAssertion.reason === 'ABSENT' ){
		return matchAssertion.value + ' is not contained in ' + matchAssertion.args[1];
	}
	else if( matchAssertion.reason === 'FAILED' ){
		return matchAssertion.value + ' does not verifiy the regexp ' + matchAssertion.args[1];
	}
}

function createFailedResolveWitExpectationMessage(resolveWithExpectation){
	var failedAssertion = resolveWithExpectation.firstFailed;

	if( failedAssertion.type == 'is' ){
		return createFailedTypeAssertionMessage(failedAssertion);
	}
	else if( failedAssertion.type === 'resolve' ){
		return 'thenable has rejected with ' + failedAssertion.returnValue + ' but was expecting to resolve with' + resolveWithExpectation.expected;
	}
	else if( failedAssertion.type === 'match' ){
		return 'thenable has resolved but ' + createFailedMatchAssertionMessage(failedAssertion);
	}
}

function createFailedResolveInExpectationMessage(resolveInExpectation){
	var failedAssertion = resolveInExpectation.firstFailed;

	if( failedAssertion.type === 'resolveDurationIs' ){
		var diff = failedAssertion.duration - failedAssertion.expectedDuration;

		if( failedAssertion.reason === 'TOO_SLOW' ){
			return 'resolving took much time than expected (+' + diff  + 'ms)';
		}
		else if( failedAssertion.reason === 'TOO_FAST' ){
			return 'resolving took less time than expected (-' + -diff  + 'ms)';
		}
	}
}

