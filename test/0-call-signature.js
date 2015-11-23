import CallSignature from '../lib/api/call-signature.js';
import assert from 'node/assert';

var emptySignature = CallSignature.create();

assert.equal(emptySignature.testArguments([]), true);
assert.equal(emptySignature.testArguments([0]), false);

var oneArgSignature = CallSignature.create(undefined);

assert.equal(oneArgSignature.testArguments([]), false);
assert.equal(oneArgSignature.testArguments([0]), true);