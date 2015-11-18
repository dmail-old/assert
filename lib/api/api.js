import proto from 'proto';

import CallSignature from './call-signature.js';

// force a specific callSignature for a method -> use()
// force X callSignature calling registered methods under a same method -> polymorph()

var API = proto.extend({
	constructor: function API(){

	}
});

export default API;