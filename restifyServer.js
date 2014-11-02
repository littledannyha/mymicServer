var assert = require('assert');
var restify = require('restify');
var fs = require('fs');
var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.queryParser());

NUMBER_OF_TRAINING_DATA = 5; 
TRIMMING_ACC_THRESHOLD = 1;
TRIMMING_GYRO_THRESHOLD = 1;

function getMagnitudes(alof) {
	var magnitudes = [];
	for (var i = 0; i < alof.length; i++) {
		magnitudes[magnitudes.length] = Math.sqrt(Math.pow(alof[i][0], 2) + Math.pow(alof[i][1], 2) + Math.pow(alof[i][2], 2) + 
							  Math.pow(alof[i][3], 2) + Math.pow(alof[i][4], 2) + Math.pow(alof[i][5], 2));
	}
	return magnitudes;
}

//var test = [[1,2,3,4,5,6],[1,1,1,1,1,1],[0,0,0,1,1,1]];
//console.log(getMagnitudes(test));

function trim(alof){
	var out = [];
	var startOfOutput = 0;
	var endOfOutput = alof.length;
	var chainAboveThreshold = 0; // current run
	var chainAboveThresholdMax = 2; // max run
	//gets the first index of the output
	for(var i = 0; i < alof.length; i++){
		var featureVector = alof[i];
		var accMagnitude = Math.sqrt(Math.pow(featureVector[0], 2) +Math.pow(featureVector[1], 2) +Math.pow(featureVector[2], 2) );
		var gyroMagnitude = Math.sqrt(Math.pow(featureVector[3], 2) +Math.pow(featureVector[4], 2) +Math.pow(featureVector[5], 2) );
		if(accMagnitude >= TRIMMING_ACC_THRESHOLD || gyroMagnitude >= TRIMMING_GYRO_THRESHOLD){
			chainAboveThreshold += 1;
			if (chainAboveThreshold >= chainAboveThresholdMax){
				var startOfOutput = i +1 - chainAboveThresholdMax;
				break;
			}
		}
		else{
			var chainAboveThreshold = 0;
		}
	}
	
	for(var i = alof.length-1; i >= 0; i--){
		var featureVector = alof[i];
		var accMagnitude = Math.sqrt(Math.pow(featureVector[0], 2) +Math.pow(featureVector[1], 2) +Math.pow(featureVector[2], 2) );
		var gyroMagnitude = Math.sqrt(Math.pow(featureVector[3], 2) +Math.pow(featureVector[4], 2) +Math.pow(featureVector[5], 2) );
			if(accMagnitude >= TRIMMING_ACC_THRESHOLD || gyroMagnitude >= TRIMMING_GYRO_THRESHOLD){
                        chainAboveThreshold += 1;
                        if (chainAboveThreshold >= chainAboveThresholdMax){
                                var endOfOutput = i + chainAboveThresholdMax;
                                break;
                        }
                }
                else{
                        var chainAboveThreshold = 0;
                }
	}
	//console.log(startOfOutput,endOfOutput);
	return alof.slice(startOfOutput, endOfOutput);
}

function scaleFeatures(alof, len2) {
	// assert len2 is less than the list length and ratio is greater than 1
	var newFeatures = [];
	var ratio = alof.length/len2;
	for(var i = 0; i< len2; i++ ) {
		newFeatures[newFeatures.length] = alof[Math.floor(i * ratio)];
	}
	return newFeatures;
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
			totalList[featureCount] += Math.abs(alof1[i][featureCount] - alof2[i][featureCount]);
		}
	}
	//console.log(totalList);
	for (var featureCount = 0; featureCount < 6; featureCount++) {
        	averageList[featureCount] = totalList[featureCount] / alof1.length;
        }

	//Uses totalList twice: once for average, once for stdDev
	for (var i = 0; i < alof1.length; i++) {
                for (var featureCount = 0; featureCount < 6; featureCount++) {
                        totalList[featureCount] += Math.abs(averageList[featureCount] - Math.abs(alof1[i][featureCount] - alof2[i][featureCount]));
                }
        }
	//console.log(totalList);

	for (var featureCount = 0; featureCount < 6; featureCount++) {
                stdDevList[featureCount] = totalList[featureCount] / alof1.length;
        }
	
	return [averageList, stdDevList];
}

function averageValues(alof1, alof2, variances) {
	var averageList = [0,0,0,0,0,0];
	var aveVariances = [[0,0,0,0,0,0],[0,0,0,0,0,0]]
	var aveList1 = [0,0,0,0,0,0];
	var aveList2 = [0,0,0,0,0,0];
	for(var i = 0; i < alof1.length; i++) {
		for (var featureCount = 0; featureCount < 6; featureCount++) {
			aveList1[featureCount] += alof1[i][featureCount];	
			aveList2[featureCount] += alof2[i][featureCount]; 
		}
	}
	for (var featureCount = 0; featureCount < 6; featureCount++) {
        	averageList[featureCount] = Math.max(aveList1[featureCount], aveList2[featureCount]) / alof1.length;
        	if (averageList[featureCount] != 0) {
			aveVariances[0][featureCount] = variances[0][featureCount] / averageList[featureCount];
			aveVariances[1][featureCount] = variances[1][featureCount] / averageList[featureCount];		
		} else {
			aveVariances[0][featureCount] = variances[0][featureCount];
			aveVariances[1][featureCount] = variances[1][featureCount];
		}
	}
	var meanVal = aveVariances[0].reduce(function(x,y){return x + y;}) / aveVariances[0].length;
	var varianceVal = aveVariances[1].reduce(function(x,y){return x + y;}) / aveVariances[1].length;
	var percentage = (1 - meanVal) * (1 - varianceVal);
	//console.log(meanVal, varianceVal, percentage);
	return percentage;
}

function getPercentage(alof1, alof2) {
	var normalizedAB = normalizeFeatures(alof1, alof2);
        //console.log(normalizedAB);
        var newa = normalizedAB[0];
        var newb = normalizedAB[1];
        var variances = getVariance(newa, newb);
        //console.log(variances);
        var percentage = averageValues(newa, newb, variances);
        //console.log("ave:", percentage);
	return percentage
}

// filepath -> object
function readObject(filepath){
	return JSON.parse(fs.readFileSync(filepath));
}

function writeObject(filepath,object){
	fs.writeFileSync(filepath,JSON.stringify(object));
}

function respond(req, res, next){
	a = JSON.parse(req.body);
	purpose = a["purpose"];
	moveName = a["moveName"];

	

	var listOfFeatureStrings = a["data"].split(';'); // ["1,2,3,4",....]
	var listOfFeatureStringList= listOfFeatureStrings.map(function(x){return x.split(',');}); // ["1","2","3"...]
	var listOfFeatureVectors = listOfFeatureStringList.map(function(x){return parseFloat(x);});
	console.log(listOfFeatureVectors);
	//console.log(listOfFeatureVectors)

	
	if(purpose.toLowerCase() == "practice"){
		// checks for the exstince of the files and errors if corrupted
		percentages = [];
		out = {};
		for(var i = 0; i < 5; i++){
			var potentialFolder = './moves/' + moveName;
			var potentialFileName = './moves/' + moveName + '/test' + String(i);
			if(fs.existsSync(potentialFolder)){
				if(!fs.existsSync(potentialFileName)){
					res.send("training data is corrupted");
					break;

				}
				else{
					ithObject = readObject(potentialFileName);
					percentages[i] = getPercentage(ithObject['data'],listOfFeatureVectors);
					

				}
			}	
		}
		out['probability'] = percentages.reduce(function(x,y){return x>y?x:y;});
		out['moveName'] = moveName;
		out['data'] = getMagnitudes(listOfFeatureVectors);
		res.send(JSON.stringify(out));
	}
	else{ // create new folder and everything
		objectToWrite = {moveName: moveName, data: listOfFeatureVectors};		
		for(var i = 0; i < 5; i++){
			var potentialFolder = './moves/' + moveName;
			var potentialFileName = './moves/' + moveName + '/test' + String(i);
			if(fs.existsSync(potentialFolder)){
				if(!fs.existsSync(potentialFileName)){
//					fs.writeFileSync(potentialFileName,JSON.stringify(listOfFeatureVectors));
					writeObject(potentialFileName,objectToWrite)
					break;
				}
			}	
		}

	}


	res.send(req.body);
	next();
}

//server.post('/',respond);

server.listen(8080, function(){
console.log('%s listening at %s',server.name, server.url);
});


function genSequentialArray(len){
	var a = []
	for(var i = 0; i < len; i++){
		a[i] = i;
	}
	return a;
}

function testScaleFeatures(){
	var alolof = [];
	for(var i = 0; i < 100; i++){
		alolof[i] = genSequentialArray(Math.random() * 1000);	
	}
	for(var i = 0; i < alolof.length; i++){
		for(var j= 0; j < alolof.length; j++){
			var maxArr = alolof[i].length > alolof[j].length ? alolof[i]:alolof[j];
			var minArr = alolof[i].length < alolof[j].length ? alolof[i]:alolof[j];

			assert.equal(minArr.length, scaleFeatures(maxArr,minArr.length).length,'failure on scaleTest' );
		}
	}
}

function genTestListForTrim(){
	var alolof = []
	for(var rep = 0; rep < 100; rep++){
		var a = []
		for(var i = 0; i < 9; i++){
			a[i] = Math.random() * TRIMMING_ACC_THRESHOLD;
		}
		
		alolof[rep] = a;
	}
	return alolof;
}

function testTrim(){
	//alolof = genTestListForTrim();
	//console.log(alolof);
	//var a = trim(alolof);
	//console.log(a);
	//console.log(scaleFeatures(a, 2));
	var a = [[0,0,0,.5,.5,.5,0,0,0],[0,0,0,.5,.5,.5,0,0,0],[0,0,0,.5,.5,.5,0,0,0],[0,0,0,.5,.5,.5,0,0,0],[0,0,0,.5,.5,.5,0,0,0],
        [0,0,0,.5,1.5,.5,0,0,0],
        [0,0,0,.5,2.5,.5,0,0,0],
        [0,0,0,.5,3.5,.5,0,0,0],
        [0,0,0,.5,4.5,.5,0,0,0],[0,0,0,.5,.5,.5,0,0,0],[0,0,0,.5,.5,.5,0,0,0]];
	var b = [[0,0,0,.5,.5,.5,0,0,0],
        [0,0,0,.5,3.5,.5,0,0,0],
        [0,0,0,.5,4.5,.5,0,0,0],
        [0,0,0,.5,.5,.5,0,0,0]];
	var percentage = getPercentage(a,b);
	console.log("percent:", percentage);
	//b = trim(b)
	//console.log(b);
	//console.log(scaleFeatures(b,2));
	//var normalizedAB = normalizeFeatures(a,b);
	//console.log(normalizedAB);
	//var newa = normalizedAB[0];
	//var newb = normalizedAB[1];
	//var variances = getVariance(newa, newb);
	//console.log(variances);
	//var featureMean = averageValues(newa, newb, variances);
	//console.log("ave:", featureMean); 
	//assert.equal(true,a[0] > TRIMMING_ACC_THRESHOLD && a[1] > TRIMMING_ACC_THRESHOLD,'testTrimFailed first Case: vector is ' + a);
//			assert.equal(a[a.length-1] > TRIMMING_ACC_THRESHOLD, 'testTrimFailed Second Case');
	//assert.equal(a[a.length-2] > TRIMMING_ACC_THRESHOLD, 'testTrimFailed third Case' );
}
testTrim();
testScaleFeatures();
