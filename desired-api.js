// API + polymorph
var FunctionProxy;

FunctionProxy.create(); // throw 'typeError API method missing'
FunctionProxy.create(function(){}); // returns a function calling original function
FunctionProxy.create(function(){}, 'a', 'b'); // set argument names to 'a' & 'b'
FunctionProxy.create(function(){}, Number, String); // force argument 0 to be a Number & 1 to be a String
FunctionProxy.create(function(){}, Number, '...'); // let argument 1 to ... to be anything
FunctionProxy.create(function(){}, {value: 10}, {value: 'a'}); // set default value for arguments
FunctionProxy.expectedThis = null;

FunctionProxy.match = function(){
	// return true if arguments match the functionProxy expectation
};
FunctionProxy.matchValues = function(values){
	// return true if malues match expected arguments
};

var proxy = FunctionProxy.create(function(){});

// proxy is a function with the method of FunctionProxy and can be called
// however if arguments & this do not match it will throw

var polymorph;

var polymorphed = polymorph(
	proxy, // you can give directly fnProxy function because it's what is used under the hood
	function(){}, // will be converted into api method
	function(a, b){}, // will be converted too
	FunctionProxy.create(function(){}, String, Number),
	FunctionProxy.create(function(a){}, {name: 'a', type: String})
);

polymorphed.match('a'); // return the first api method matching the signature
polymorphed(); // call the first api method matching or throw will the last unmatched api method error

// function proxy.create will be exported as api()
// polymorph will be exported as api.polymorph()

/*
var Test;

// UNI TEST
var test = Test.create(function(){
	this.expect(10).equals(10);
	this.expect(Promise.resolve()).resolveWith(undefined);

	var spyA = this.spy();
	spyA();

	this.expect(spyA).calledOn(undefined);
	this.expect(spyA).calledWith(undefined);

	var spyB = this.spy();
	// assert spyB will be called (it's not yet called)
	this.expect(spyB).resolveWith({thisValue: undefined, argValues: []});
	spyB();
});

// EXPECTATION
var Expectation;
var expectation = Expectation.create(10);

expectation.is(Number); // returns an assertion
expectation.equals(10); // returns an assertion
*/