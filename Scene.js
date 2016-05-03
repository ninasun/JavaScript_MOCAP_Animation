//Purpose: Code to parse and render scene files

//////////////////////////////////////////////////////////
///////         SCENE LOADING CODE              //////////
//////////////////////////////////////////////////////////



function setupScene(glcanvas) {
   //Now that the scene has loaded, setup the glcanvas
    glcanvas.scene={}
    glcanvas.scene.currentScene = NaN;
    glcanvas.scene.finalScene = NaN;
    glcanvas.scene.trajectories=[];
    glcanvas.scene.boneStarts=[];
    glcanvas.scene.boneEnds=[];
    glcanvas.scene.defined = false;
    SceneCanvas(glcanvas, 'GLEAT/DrawingUtils', 800, 600);
    requestAnimFrame(glcanvas.repaint);
}

function loadScene(asf,amc,glcanvas){
    var scene={};
    scene.trajectories=getAllTrajectories(asf,amc)
    var bones=getBoneEndPoints(asf,scene.trajectories);
    scene.boneStarts=bones.starts;
    scene.boneEnds=bones.ends;
    scene.finalScene = amc.sceneCount - 1;
    scene.currentScene = 0;
    scene.defined = true;
    glcanvas.scene=scene;
}

// controls for GUI
// global FPS variable determines when new scene is rendered
FPS = 120;
var interval = null;
function animateFigure(glcanvas) {
  interval = setInterval(animate, 1000/FPS);
}

function animate() {
  if (glcanvas.scene.currentScene < glcanvas.scene.finalScene) {
    requestAnimFrame(glcanvas.repaint)
    glcanvas.scene.currentScene+=1;
  }
  if (glcanvas.scene.currentScene == glcanvas.scene.finalScene) { resetScene(); }
}

function pause() {
  clearInterval(interval);
}

function resetScene(){
  glcanvas.scene.currentScene = 0;
  clearInterval(interval);
  requestAnimFrame(glcanvas.repaint);
}

//////////////////////////////////////////////////////////
///////           RENDERING CODE                //////////
//////////////////////////////////////////////////////////

BEACON_SIZE = 0.8;

function drawBeacon(glcanvas, pMatrix, mvMatrix, joint, mesh, color) {
	m = mat4.create();
	mat4.translate(m, m, joint);
	mat4.scale(m, m, vec3.fromValues(BEACON_SIZE, BEACON_SIZE, BEACON_SIZE));
	mat4.mul(m, mvMatrix, m);
    mesh.render(glcanvas.gl, glcanvas.shaders, pMatrix, m, color, joint, [0, 0, 0], color, false, false, false, COLOR_SHADING);
}


//Update the beacon positions on the web site
function vec3StrFixed(v, k) {
    return "(" + v[0].toFixed(k) + ", " + v[1].toFixed(2) + ", " + v[2].toFixed(2) + ")";
}
function updateBeaconsPos() {
    var sourcePosE = document.getElementById("sourcePos");
    var receiverPosE = document.getElementById("receiverPos");
    var externalPosE = document.getElementById("externalPos");
    externalPosE.innerHTML = "<font color = \"blue\">" + vec3StrFixed(glcanvas.externalCam.pos, 2) + "</font>";
}


//A function that adds lots of fields to glcanvas for rendering the scene graph
function SceneCanvas(glcanvas, shadersRelPath, pixWidth, pixHeight) {

    // //Rendering properties
     glcanvas.drawJoints = true;
     glcanvas.drawBones = true;

	glcanvas.gl = null;
	glcanvas.lastX = 0;
	glcanvas.lastY = 0;
	glcanvas.dragging = false;
	glcanvas.justClicked = false;
	glcanvas.clickType = "LEFT";

	//Lighting info
	glcanvas.ambientColor = vec3.fromValues(0.3, 0.3, 0.3);
	glcanvas.light1Pos = vec3.fromValues(0, 0, 0);
	glcanvas.light2Pos = vec3.fromValues(0, 0, -1);
	glcanvas.lightColor = vec3.fromValues(0.9, 0.9, 0.9);

	//Scene and camera stuff
    glcanvas.externalCam = new FPSCamera(pixWidth, pixHeight, 0.75);
    glcanvas.externalCam.pos = vec3.fromValues(50, 40, 120);
    glcanvas.walkspeed = 20;//How many meters per second
    glcanvas.lastTime = (new Date()).getTime();
    glcanvas.movelr = 0;//Moving left/right
    glcanvas.movefb = 0;//Moving forward/backward
    glcanvas.moveud = 0;//Moving up/down
    glcanvas.camera = glcanvas.externalCam;
	//Meshes for source and receiver
    glcanvas.beaconMesh = getIcosahedronMesh();
    updateBeaconsPos();

	/////////////////////////////////////////////////////
	//Step 1: Setup repaint function
	/////////////////////////////////////////////////////
	glcanvas.repaintRecurse = function(node, pMatrix, matrixIn) {
	    var mvMatrix = mat4.create();
	    mat4.mul(mvMatrix, matrixIn, node.transform);
        node.mesh.render(glcanvas.gl, glcanvas.shaders, pMatrix, mvMatrix, glcanvas.ambientColor, glcanvas.light1Pos, glcanvas.light2Pos, glcanvas.lightColor, false, glcanvas.drawEdges, false, COLOR_SHADING);
		if ('children' in node) {
		    for (var i = 0; i < node.children.length; i++) {
		        glcanvas.repaintRecurse(node.children[i], pMatrix, mvMatrix);
		    }
		}
	}

	glcanvas.repaint = function() {
	  glcanvas.light1Pos = glcanvas.camera.pos;
		glcanvas.gl.viewport(0, 0, glcanvas.gl.viewportWidth, glcanvas.gl.viewportHeight);
		glcanvas.gl.clear(glcanvas.gl.COLOR_BUFFER_BIT | glcanvas.gl.DEPTH_BUFFER_BIT);

		var pMatrix = mat4.create();
		mat4.perspective(pMatrix, 45, glcanvas.gl.viewportWidth / glcanvas.gl.viewportHeight, 0.01, 300.0);
		//First get the global modelview matrix based on the camera
		var mvMatrix = glcanvas.camera.getMVMatrix();
		//Then drawn the scene

    if (glcanvas.scene.defined) {


      if (glcanvas.drawJoints){
        for(var i=0; i<glcanvas.scene.trajectories[0].length; i++){
            var index = glcanvas.scene.currentScene;
            //console.log(index);
            var curr = glcanvas.scene.trajectories[index];
            drawBeacon(glcanvas, pMatrix, mvMatrix, curr[i], glcanvas.beaconMesh, vec3.fromValues(1, 0, 1));
        }
      }
        //Draw the paths
      if (glcanvas.drawBones){
        glcanvas.drawer.reset();

        for(var i=0; i<glcanvas.scene.boneStarts[0].length; i++){
            var index = glcanvas.scene.currentScene;
            var currStart = glcanvas.scene.boneStarts[index];
            var currEnd= glcanvas.scene.boneEnds[index];
            glcanvas.drawer.drawLine(currStart[i],currEnd[i], vec3.fromValues(0,1,1) );
        }
        glcanvas.drawer.repaint(pMatrix, mvMatrix);
      }
    }

		//Redraw if walking
		if (glcanvas.movelr != 0 || glcanvas.moveud != 0 || glcanvas.movefb != 0) {
		    var thisTime = (new Date()).getTime();
		    var dt = (thisTime - glcanvas.lastTime)/1000.0;
		    glcanvas.lastTime = thisTime;
		    glcanvas.camera.translate(0, 0, glcanvas.movefb, glcanvas.walkspeed*dt);
		    glcanvas.camera.translate(0, glcanvas.moveud, 0, glcanvas.walkspeed*dt);
		    glcanvas.camera.translate(glcanvas.movelr, 0, 0, glcanvas.walkspeed*dt);
		    updateBeaconsPos(); //Update HTML display of vector positions
		    requestAnimFrame(glcanvas.repaint);
		}
	}

	/////////////////////////////////////////////////////////////////
	//Step 2: Setup mouse and keyboard callbacks for the camera
	/////////////////////////////////////////////////////////////////
	glcanvas.getMousePos = function(evt) {
		var rect = this.getBoundingClientRect();
		return {
		    X: evt.clientX - rect.left,
		    Y: evt.clientY - rect.top
		};
	}

	glcanvas.releaseClick = function(evt) {
		this.dragging = false;
		requestAnimFrame(this.repaint);
		return false;
	}

	glcanvas.mouseOut = function(evt) {
		this.dragging = false;
		requestAnimFrame(this.repaint);
		return false;
	}

	glcanvas.makeClick = function(e) {
	    var evt = (e == null ? event:e);
	    glcanvas.clickType = "LEFT";
		if (evt.which) {
		    if (evt.which == 3) glcanvas.clickType = "RIGHT";
		    if (evt.which == 2) glcanvas.clickType = "MIDDLE";
		}
		else if (evt.button) {
		    if (evt.button == 2) glcanvas.clickType = "RIGHT";
		    if (evt.button == 4) glcanvas.clickType = "MIDDLE";
		}
		this.dragging = true;
		this.justClicked = true;
		var mousePos = this.getMousePos(evt);
		this.lastX = mousePos.X;
		this.lastY = mousePos.Y;
		requestAnimFrame(this.repaint);
		return false;
	}

	//Mouse handlers for camera
	glcanvas.clickerDragged = function(evt) {
		var mousePos = this.getMousePos(evt);
		var dX = mousePos.X - this.lastX;
		var dY = mousePos.Y - this.lastY;
		this.lastX = mousePos.X;
		this.lastY = mousePos.Y;
		if (this.dragging) {
		    //Rotate camera by mouse dragging
		    this.camera.rotateLeftRight(-dX);
		    this.camera.rotateUpDown(-dY);
		    requestAnimFrame(glcanvas.repaint);
		}
		return false;
    }

    //Keyboard handlers for camera
    glcanvas.keyDown = function(evt) {
        if (evt.keyCode == 87) { //W
            glcanvas.movefb = 1;
        }
        else if (evt.keyCode == 83) { //S
            glcanvas.movefb = -1;
        }
        else if (evt.keyCode == 65) { //A
            glcanvas.movelr = -1;
        }
        else if (evt.keyCode == 68) { //D
            glcanvas.movelr = 1;
        }
        else if (evt.keyCode == 67) { //C
            glcanvas.moveud = -1;
        }
        else if (evt.keyCode == 69) { //E
            glcanvas.moveud = 1;
        }
        glcanvas.lastTime = (new Date()).getTime();
        requestAnimFrame(glcanvas.repaint);
    }

    glcanvas.keyUp = function(evt) {
        if (evt.keyCode == 87) { //W
            glcanvas.movefb = 0;
        }
        else if (evt.keyCode == 83) { //S
            glcanvas.movefb = 0;
        }
        else if (evt.keyCode == 65) { //A
            glcanvas.movelr = 0;
        }
        else if (evt.keyCode == 68) { //D
            glcanvas.movelr = 0;
        }
        else if (evt.keyCode == 67) { //C
            glcanvas.moveud = 0;
        }
        else if (evt.keyCode == 69) { //E
            glcanvas.moveud = 0;
        }
        requestAnimFrame(glcanvas.repaint);
    }

	/////////////////////////////////////////////////////
	//Step 4: Initialize Web GL
	/////////////////////////////////////////////////////
	glcanvas.addEventListener('mousedown', glcanvas.makeClick);
	glcanvas.addEventListener('mouseup', glcanvas.releaseClick);
	glcanvas.addEventListener('mousemove', glcanvas.clickerDragged);
	glcanvas.addEventListener('mouseout', glcanvas.mouseOut);

	//Support for mobile devices
	glcanvas.addEventListener('touchstart', glcanvas.makeClick);
	glcanvas.addEventListener('touchend', glcanvas.releaseClick);
	glcanvas.addEventListener('touchmove', glcanvas.clickerDragged);

    //Keyboard listener
    var medadiv = document.getElementById('metadiv');
    document.addEventListener('keydown', glcanvas.keyDown, true);
    document.addEventListener('keyup', glcanvas.keyUp, true);

	try {
	    //this.gl = WebGLDebugUtils.makeDebugContext(this.glcanvas.getContext("experimental-webgl"));
	    glcanvas.gl = glcanvas.getContext("experimental-webgl");
	    glcanvas.gl.viewportWidth = glcanvas.width;
	    glcanvas.gl.viewportHeight = glcanvas.height;
	} catch (e) {
		console.log(e);
	}
	if (!glcanvas.gl) {
	    alert("Could not initialise WebGL, sorry :-(.  Try a new version of chrome or firefox and make sure your newest graphics drivers are installed");
	}
	glcanvas.shaders = initShaders(glcanvas.gl, shadersRelPath);

    glcanvas.drawer = new SimpleDrawer(glcanvas.gl, glcanvas.shaders);//Simple drawer object for debugging
    glcanvas.pathDrawer = new SimpleDrawer(glcanvas.gl, glcanvas.shaders);//For drawing reflection paths

	glcanvas.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	glcanvas.gl.enable(glcanvas.gl.DEPTH_TEST);

	glcanvas.gl.useProgram(glcanvas.shaders.colorShader);
	requestAnimFrame(glcanvas.repaint);
}
