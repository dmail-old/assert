import CallSignature from '../lib/api/call-signature.js';
import assert from 'node/assert';

function createArgSignature(){
	return CallSignature.create(Array.prototype.slice.call(arguments));
}

function signatureEquals(callSignature, args, expectedSignedArgs){
	assert.deepEqual(callSignature.signArguments(args), expectedSignedArgs);
}

function signaturePass(callSignature, args){
	signatureEquals(callSignature, args, args);
}

function signatureFail(callSignature, args){
	try{
		callSignature.signArguments(args);
		var error = new Error('signature expected to fail');
		error.name = 'failure_expected';
		throw error;
	}
	catch(e){
		if( e.name != 'SignatureError' ){
			throw e;
		}
	}
}

export default function(){
	var allowAnyArgSignature = createArgSignature();

	signaturePass(allowAnyArgSignature, []);
	signaturePass(allowAnyArgSignature, ['a', 10]);

	var allowExactlyOneArgSignature = createArgSignature(undefined);

	signaturePass(allowExactlyOneArgSignature, [undefined]);
	signaturePass(allowExactlyOneArgSignature, [10]);
	signatureFail(allowExactlyOneArgSignature, []);

	var allowAtLeastOneArgSignature = createArgSignature(undefined, '...');

	signaturePass(allowAtLeastOneArgSignature, [undefined]);
	signaturePass(allowAtLeastOneArgSignature, [10, 11]);
	signatureFail(allowAtLeastOneArgSignature, []);

	var expectOneStringSignature = createArgSignature({type: String});

	signaturePass(expectOneStringSignature, ['']);
	// jshint ignore: start
	signaturePass(expectOneStringSignature, [new String('')]);
	// jshint ignore: end
	signatureFail(expectOneStringSignature, [10]);

	var expectOneStringProvidingDefaultValidValue = createArgSignature({type: String, value: 'foo'});

	signatureEquals(expectOneStringProvidingDefaultValidValue, ['hello'], ['hello']);
	signatureEquals(expectOneStringProvidingDefaultValidValue, [], ['foo']);

	var expectTwoArgWithSecondDependingOnFirst = createArgSignature(undefined, {value(a){ return a + 1; }});

	signatureEquals(expectTwoArgWithSecondDependingOnFirst, [1], [1, 2]);
	signatureEquals(expectTwoArgWithSecondDependingOnFirst, [1, 3], [1, 3]);
}

