import Called from './assertion/called.js';
import Returned from './assertion/returned.js';
import Threw from './assertion/threw.js';

import Match from './assertion/match.js';

// sinon on pourrait écrire comme ça :

/*

je m'attends à ce que la promesse soit résolu avec undefined dans 10ms

expect(10).match(10);
expect(10).validate({kind: 'number'});
expect(Promise.resolve()).willResolve().with(undefined).in(10);
expect(Promise.resolve()).willTimeout().in(10);
expect(Spy.create()).willBeCalled().on(undefined).with([]).in(10);
expect(spy).called().on().with()
expect(spy).threw().with()
expect(spy).returned().with()
expect(spy).willThrow()

// il existe donc des manière de récup la valeur avant de la tester

.willResolve() ensure thenable resolve to next assertion are made on resolution value
.willReject() same with rejection value
.willTimeout() is a specific assertion which doesn't modify the tested value
.called() ensure spy was called value becomes spy.args
.calledOn() ensure spy was called value becomes spy.thisValue
.threw() ensure spy was called value becomes spy.error
.returned() ensure spy was called value becomes spy.returnValue

c'est trop tôt pour décire ça, toujours est-il que j'ai besoin de manière de tester des valeurs

*/

var assertions = [
	Called
];

export default assertions;