// amc_parse.js by Brandon Choi, Nina Sun, Cosi Goldstein


// Create object called AMC that holds all Scene objects and their data
function AMC (allScenes) {
	this.scenes = allScenes;
	this.sceneCount = this.scenes.length;
}

// Create object called Scene that holds all the values specified in .amc file.
// initialize all empty arrays and NaN values for single floats to be filled in later when data is parsed.

function Scene () {
	this.sceneNum = NaN;
	this.root = [];
	this.lowerback = [];
	this.upperback = [];
	this.thorax = [];
	this.lowerneck = [];
	this.upperneck = [];
	this.head = [];
	this.rclavicle = [];
	this.rhumerus = [];
	this.rradius = [];
	this.rwrist = [];
	this.rhand = [];
	this.rfingers = [];
	this.rthumb = [];
	this.lclavicle = [];
	this.lhumerus = [];
	this.lradius = [];
	this.lwrist = [];
	this.lhand = [];
	this.lfingers = [];
	this.lthumb = [];
	this.rfemur = [];
	this.rtibia = [];
	this.rfoot = [];
	this.rtoes = [];
	this.lfemur = [];
	this.ltibia = [];
	this.lfoot = [];
	this.ltoes = [];
}

// Parses an entire .amc file into multiple scenes.
// Each scene is sent to parseScene() to derive values for individual scenes.
function parseAMC(file) {
	var lines = file.split("\n")
	var allSceneData = [];
	var currentData = "";
	var sceneCounter = 1;

	// get rid of unnecessary data in beginning of amc file //
	// ex: #!OML:ASF F:\VICON\USERDATA\INSTALL\rory3\rory3.ASF, :FULLY-SPECIFIED, :DEGREES
	var start = 0;
	while (true) {
		var splitData = lines[start].split(" ");
		// if we have reached the line with "1" signifying start of first scene
		if (splitData.length == 1 && parseInt(splitData[0]) == 1) { break; }
		// else keep incrementing start
		else { start++; }
	}

	// iterate and parse scene data //
	for (i = start; i < lines.length; i++) {
		// if it is a new scenes
		var splitData = lines[i].split(" ");
		// if it is the final line, also append the last scene
		if (i == lines.length - 1) {
			allSceneData.push(currentData);
			currentData = "";
		}
		// if it is a new scene number, then push all currentData
		else if (splitData.length ==  1 && parseInt(splitData[0]) == sceneCounter+1) {
			allSceneData.push(currentData);
			currentData = "";
			// next time it is a new scene, it should be the next sceneCounter
			sceneCounter++;
			currentData += splitData[0];
		}
		// not a new scene so concatenate all the parts of the split data into currentData
		else {
			for (j = 0; j < splitData.length; j++) {
				if (currentData.length == 0) { currentData = currentData + splitData[j]; }
				else { currentData = currentData + " " + splitData[j]; }
			}
		}
	}

	// construct scene objects and append to allScenes array //
	var allScenes = []
	for (s = 0; s < allSceneData.length; s++) {
		var scene = parseScene(allSceneData[s]);
		allScenes.push(scene);
	}

	// returns AMC object
	var myAMC = new AMC(allScenes);
	console.log(myAMC);
	return myAMC;
}

// Parses a single 'scene' within the .amc file.
// Takes in a string as a parameter and creates an object that holds all the necessary values.
function parseScene(data) {
	// init new Scene object
	var myScene = new Scene();
	// loop through data that is inputted as a string and assign values accordingly
	var data = data.split(" "); // split between spaces
	// first line of data should always be a scene number
	myScene.sceneNum = data[0];
	// add values based on which bone's info it is currently parsing
	var currentBone = "";
	for (i = 1; i < data.length; i++) {
		// if string is not a number, then it signifies a new bone
		if (isNaN(parseInt(data[i])))
			currentBone = data[i];
		// else, add values to bone's attributes
		else {
			num = parseFloat(data[i]);
	       //append new value
				myScene[currentBone].push(num);
		}
	}
	return myScene;
}
