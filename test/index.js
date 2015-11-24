import nodeFs from 'node/fs';

var testDirectoryLocation = platform.locate('./test', true);

var testFileLocations = nodeFs.readdirSync(testDirectoryLocation).filter(function(fileName){
	return fileName != 'index.js';
}).map(function(fileName){
	return 'file:///' + testDirectoryLocation + '/' + fileName;
});

var testPromise = testFileLocations.reduce(function(previous, current){
	return previous.then(function(){
		return System.import(current).then(function(exports){
			return exports['default'];
		}).then(function(test){
			if( test ){
				if( typeof test != 'function' ){
					throw new Error(current + ' export default must be a function');
				}
				console.log(current);

				return new Promise(function(resolve){
					resolve(test());
				}).then(function(){
					console.log('\tpassed');
				}, function(error){
					console.log('\tfailed', error);
					return Promise.reject(error);
				});
			}
			return undefined;
		});
	});
}, Promise.resolve());

testPromise.then(function(){
	console.log('Finished');
}, function(error){
	console.error(error.stack);
});