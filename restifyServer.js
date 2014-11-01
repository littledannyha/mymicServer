var restify = require('restify');
var fs = require('fs');
var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.queryParser());

function trim(alof,threshold){
	var out = [];
	var startOfOutput = 0;
	var endOfOutput = alof.length;
	var chainAboveThreshold = 0;
	//gets the first index of the output
	for(var i = 0; i < alof.length; i++){
		if(alof[i] >= threshold){
			chainAboveThreshold += 1;
			if (chainAboveThreshold >= 2){
				startOfOutput = i;
				break;
			}
		}
		else{
			chainAboveThreshold = 0;
		}
	}
	
	for(var i = alof.length;i >= 0; i--){
		if(alof[i] >= threshold){


		}
	}
}

function respond(req, res, next){
	a = JSON.parse(req.body);
	purpose = a["purpose"];
	moveName = a["moveName"];



	listOfFeatureStrings = a["data"].split(';'); // ["1,2,3,4",....]
	listOfFeatureStringList= listOfFeatureStrings.map(function(x){return x.split(',');}); // ["1","2","3"...]
	listOfFeatureVectors = listOfFeatureStringList.map(function(x){return parseFloat(x);});
	console.log(listOfFeatureVectors);

	res.send(req.body);
	next();
}

server.post('/',respond);


server.listen(8080, function(){
	console.log('%s listening at %s',server.name, server.url);
});



