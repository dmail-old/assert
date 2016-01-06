import AsyncAssertion from '../assertion-async.js';

var willResolve = AsyncAssertion.extend('willResolve', {
	expectedState: 'RESOLVED'
});

export default willResolve;