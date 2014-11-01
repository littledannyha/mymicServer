var restify = require('restify');
var fs = require('fs');
var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.queryParser());



NUMBER_OF_TRAINING_DATA = 5; 

function trim(alof,threshold){
	var out = [];
	var startOfOutput = 0;
	var endOfOutput = alof.length;
	var chainAboveThreshold = 0;
	var chainAboveThresholdMax = 10;
	//gets the first index of the output
	for(var i = 0; i < alof.length; i++){
		var featureVector = alof[i];
		var accMagnitude = Math.sqrt( pow(featureVector[0], 2) + pow(featureVector[1], 2) + pow(featureVector[2], 2) );
		var gyroMagnitude = Math.sqrt( pow(featureVector[3], 2) + pow(featureVector[4], 2) + pow(featureVector[5], 2) );
		if(accMagnitude >= threshold || gyroMagnitude >= threshold){
			chainAboveThreshold += 1;
			if (chainAboveThreshold >= chainAboveThresholdMax){
				startOfOutput = i - chainAboveThresholdMax;
				break;
			}
		}
		else{
			chainAboveThreshold = 0;
		}
	}
	
	for(var i = alof.length; i >= 0; i--){
		var featureVector = alof[i];
		var accMagnitude = Math.sqrt( pow(featureVector[0], 2) + pow(featureVector[1], 2) + pow(featureVector[2], 2) );
                var gyroMagnitude = Math.sqrt( pow(featureVector[3], 2) + pow(featureVector[4], 2) + pow(featureVector[5], 2) );
                if(accMagnitude >= threshold || gyroMagnitude >= threshold){
                        chainAboveThreshold += 1;
                        if (chainAboveThreshold >= chainAboveThresholdMax){
                                endOfOutput = i + chainAboveThresholdMax;
                                break;
                        }
                }
                else{
                        chainAboveThreshold = 0;
                }
	}
	return alof.slice(startOfOutput, endOfOutput);
}

function scaleFeatures(alof, len2) {
	var newFeatures = [];
	for(var i = 0; Math.floor(i) < alof.length; i += ratio) {
		newFeatures.append(alof[Math.floor(i)]);
	}
	if (newFeature.length == len2) {
		return newFeatures;
	} else {
		return [-999] + newFeatures;
	}
}

function normalizeFeatures(alof1, alof2) {
	var trimAlof1 = trim(alof1);
	var trimAlof2 = trim(alof2);
	if (trimAlof1.length > trimAlof2.length) {
		trimAlof1 = scaleFeatures(trimAlof1, trimAlof2.length)
	} else {
		trimAlof2 = scaleFeatures(trimAlof2, trimAlof1.length)
	}
	return [trimAlof1, trimAlof2];
}

function getVariance(alof1, alof2) {
	//alof = a list of list of floats
	//both are same length
	var totalList = [0,0,0,0,0,0];
	var averageList = [0,0,0,0,0,0];
	var stdDevList = [0,0,0,0,0,0];
	
	for (var i = 0; i < alof1.length; i++) {
		for (var featureCount = 0; featureCount < 6; featureCount++) {
			totalList[featureCount] += Math.abs(alof1[i] - alof2[i]);
		}
	}

	for (var featureCount = 0; featureCount < 6; featureCount++) {
        	averageList[featureCount] = totalList[featureCount] / alof1.length;
        }

	//Uses totalList twice: once for average, once for stdDev
	for (var i = 0; i < alof1.length; i++) {
                for (var featureCount = 0; featureCount < 6; featureCount++) {
                        totalList[featureCount] += Math.abs(averageList[featureCount] - Math.abs(alof1[i] - alof2[i]));
                }
        }

	for (var featureCount = 0; featureCount < 6; featureCount++) {
                stdDevList[featureCount] = totalList[featureCount] / alof1.length;
        }
	return [averageList, stdDevList];
}

function respond(req, res, next){
	a = JSON.parse(req.body);
	purpose = a["purpose"];
	moveName = a["moveName"];



	listOfFeatureStrings = a["data"].split(';'); // ["1,2,3,4",....]
	listOfFeatureStringList= listOfFeatureStrings.map(function(x){return x.split(',');}); // ["1","2","3"...]
	listOfFeatureVectors = listOfFeatureStringList.map(function(x){return parseFloat(x);});
	console.log(listOfFeatureVectors);

	
	if(purpose.toLowerCase() == "practice"){
		// checks for the exstince of the files and errors if corrupted
		for(var i = 0; i < 5; i++){
			potentialFolder = './moves/' + moveName;
			potentialFileName = './moves/' + moveName + '/test' + String(i);
			if(fs.existsSync(potentialFolder){
				if(!fs.existsSync(potentialFileName)){
					res.send("training data is corrupted");
					break;
				}
			}	
		}

		// INSERT CALCULATIONS HERE	
	}
	else{ // create new folder and everything

		for(var i = 0; i < 5; i++){
			potentialFolder = './moves/' + moveName;
			potentialFileName = './moves/' + moveName + '/test' + String(i);
			if(fs.existsSync(potentialFolder){
				if(!fs.existsSync(potentialFileName)){
					fs.writeFileSync(potentialFileName,String(listOfFeatureVectors));
					break;
				}
			}	
		}

	}


	res.send(req.body);
	next();
}

server.post('/',respond);


server.listen(8080, function(){
	console.log('%s listening at %s',server.name, server.url);
});



