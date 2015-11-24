import CallSignature from '../lib/api/call-signature.js';
import assert from 'node/assert';

function signatureEquals(callSignature, args, expectedSignedArgs){
	assert.deepEqual(callSignature.signArguments(args), expectedSignedArgs);
}

function signaturePass(callSignature, args){
	signatureEquals(callSignature, args, args);
}

function signatureFail(callSignature, args){
	assert.throws(function(){
		callSignature.signArguments(args);
	}, function(e){
		return e.name == 'SignatureError';
	});
}

export default function(){
	var allowAnyArgSignature = CallSignature.create();

	signaturePass(allowAnyArgSignature, []);
	signaturePass(allowAnyArgSignature, ['a', 10]);

	var allowExactlyOneArgSignature = CallSignature.create(undefined);

	signaturePass(allowExactlyOneArgSignature, [undefined]);
	signaturePass(allowExactlyOneArgSignature, [10]);
	signatureFail(allowExactlyOneArgSignature, []);

	var allowAtLeastOneArgSignature = CallSignature.create(undefined, '...');

	signaturePass(allowAtLeastOneArgSignature, [undefined]);
	signaturePass(allowAtLeastOneArgSignature, [10, 11]);
	signatureFail(allowAtLeastOneArgSignature, []);

	var expectOneStringSignature = CallSignature.create({
		type: String
	});

	signaturePass(expectOneStringSignature, ['']);
	// jshint ignore: start
	signaturePass(expectOneStringSignature, [new String('')]);
	// jshint ignore: end
	signatureFail(expectOneStringSignature, [10]);

	var expectOneStringProvidingDefaultValidValue = CallSignature.create({
		type: String,
		value: 'foo'
	});

	signatureEquals(expectOneStringProvidingDefaultValidValue, ['hello'], ['hello']);
	signatureEquals(expectOneStringProvidingDefaultValidValue, [], ['foo']);

	var expectTwoArgWithSecondDependingOnFirst = CallSignature.create(
		undefined, {value(a){ return a + 1; }}
	);

	signatureEquals(expectTwoArgWithSecondDependingOnFirst, [1], [1, 2]);
	signatureEquals(expectTwoArgWithSecondDependingOnFirst, [1, 3], [1, 3]);

	var expectThisToBeAString = CallSignature.create();
	expectThisToBeAString.expectedThis = String;
	expectThisToBeAString.thisValue = 'foo';

	assert.equal(expectThisToBeAString.signThis(''), '');
	assert.equal(expectThisToBeAString.signThis(undefined), 'foo');
}

