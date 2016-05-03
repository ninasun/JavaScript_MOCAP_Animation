//finds the local quaternion rotations for each bone
function convert2quat(asf, amc) {
    switch(asf.units.angle) {
    case "deg":
        var conversion_factor=Math.PI/180;
        break;
    case "rad":
        var conversion_factor=1;
        break;
    default:
        console.log("Unknown angle unit")
    }
    rotationQuat=[];
    for(var i=0; i<asf.boneData.length; i++){
        var bone=asf.boneData[i];
        rotationQuat[i]=new Array(amc.sceneCount);
        for(var j=0; j<amc.sceneCount ; j++){
            var scene=amc.scenes[j];
            var eulers=[0,0,0];
            //convert amc angles into radians
            if(typeof bone.dof !== 'undefined'){
            for(var k=0; k<bone.dof.length; k++){
                if(bone.dof[k]=="rx"){
                    eulers[0]=scene[bone.name][k]*conversion_factor;
                }
                if(bone.dof[k]=="ry"){
                    eulers[1]=scene[bone.name][k]*conversion_factor;
                }
                if(bone.dof[k]=="rz"){
                    eulers[2]=scene[bone.name][k]*conversion_factor;
                }
                // eulers.push(scene[bone.name][k]*conversion_factor);
            }
            }
            //convert axis into quaternion
            //note the Matlab parser uses w,x,y,z for quat, but GL-matrix is x,y,z,w
            axisrad=[];
            for(var k=0; k< bone.axis.length; k++){
                    axisrad.push(bone.axis[k]*conversion_factor)
                }
            var axis_quat=euler2quat(axisrad);

            //find rotation quaternion
            if(bone.name=="root"){
                root_rot=[];
                for(var k=3; k<scene[bone.name].length; k++){
                    root_rot.push(scene[bone.name][k]*conversion_factor)
                }
                var rotation_quat=euler2quat(root_rot)
                rotationQuat[i][j]=rotation_quat;
            }
            else{
                //rotation_quat=axis_quat*R*axisInv
                var r=euler2quat(eulers);
                var rotation_quat=quat.create();
                var axisInv=quat.create();
                quat.invert(axisInv, axis_quat);
                quat.multiply(rotation_quat,axis_quat,r);
                quat.multiply(rotation_quat,rotation_quat,axisInv);
                rotationQuat[i][j]=rotation_quat;
            }
        
        }
    }
   // console.log(rotationQuat)
    return rotationQuat;
}

// helper to convert a vec3 of euler angle rotations (XYZ) into quaternions
function euler2quat(euler){
    var r=quat.create();
    var RZ=quat.create();
    var RY=quat.create();
    var RX=quat.create();
    quat.rotateZ(RZ, RZ, euler[2]);
    quat.rotateY(RY, RY, euler[1]);
    quat.rotateX(RX, RX, euler[0]);
    quat.multiply(r,RZ, RY);
    quat.multiply(r,r,RX);
    return r;
}

// gets all the joint positions for all scenes
function getAllTrajectories(asf, amc){
    var mot=convert2quat(asf,amc);
    for(var i=1; i<asf.boneData.length; i++){
        var bone=asf.boneData[i];
        var offset=vec3.fromValues(bone.direction[0],bone.direction[1],bone.direction[2]);
        vec3.scale(offset,offset,bone.length/asf.units.length);
        asf.boneData[i].offset=offset;
    }

    var allTrajectories=[];
    for(var i=0; i<amc.sceneCount; i++){
        allTrajectories.push(getTrajectories(asf, amc.scenes[i], mot));
    }
    return allTrajectories;
}

//gets the trajectories for a single scene
function getTrajectories(asf,scene,mot){
    var rootTranslation=vec3.fromValues(scene["root"][0],scene["root"][1],scene["root"][2]);
    vec3.scale(rootTranslation,rootTranslation,1/asf.units.length);
    var rootOffset=vec3.fromValues(asf.boneData[0].position[0],asf.boneData[0].position[1],asf.boneData[0].position[2])
    vec3.scale(rootOffset,rootOffset,1/asf.units.length);
    var initialPos=vec3.create();
    vec3.add(initialPos,rootTranslation,rootOffset);
    var sceneTrajectories=[];
    var sceneNumber=parseInt(scene.sceneNum)-1; //AMC indexing starts at 1
    var trajectories=getTrajectoriesHelper(asf,mot,sceneNumber,0,initialPos,mot[0][sceneNumber],sceneTrajectories);
    return trajectories;
}

//traverses the hierarchy and finds the positions of the joints in space
function getTrajectoriesHelper(asf,mot,sceneNumber,index,current_position,current_rotation,trajectories){
    trajectories[index]=current_position;
    for(var i=0; i<asf.boneData[index].children.length; i++){
        var child=asf.boneData[index].children[i];
        //get the rotation of the child by multiplying current rotation by the child rotation
        var child_rotation=quat.create();
        quat.multiply(child_rotation,current_rotation,mot[child][sceneNumber]);
        //get the position of the child by rotating by the quaterion qpq^-1
        var crInv=quat.create();
        quat.invert(crInv, child_rotation);
        var localQuat=quat.create();
        var c = asf.boneData[child];
        //get offset position as a quaterion
        var child_offset=quat.fromValues(c.offset[0],c.offset[1],c.offset[2],0);
        quat.multiply(localQuat,child_rotation,child_offset);
        quat.multiply(localQuat,localQuat,crInv);
        var localPos=vec3.fromValues(localQuat[0],localQuat[1],localQuat[2]);
        // get the child's position by adding the result to the current position
        var child_position=vec3.create();
        vec3.add(child_position,current_position,localPos);
        trajectories = getTrajectoriesHelper(asf, mot, sceneNumber, child, child_position, child_rotation, trajectories);
        
    }
    return trajectories;
}


//finds the start and end points of the bones to be used for animation
function getBoneEndPoints(asf,trajectories){
    startPoints=[];
    endPoints=[];
    // for each scene
    for(var i=0; i<trajectories.length; i++){
        boneLines=getBoneHelper(0,asf,trajectories[i],[],[]);
        startPoints.push(boneLines.starts);
        endPoints.push(boneLines.ends);
    }
    return {starts:startPoints,ends:endPoints};
}

//traverses the bone hierarchy to get the beginning and end points of the bones for a single scene
function getBoneHelper(index,asf,sceneTrajectories,startArray,endArray){
    for(var i=0; i<asf.boneData[index].children.length; i++){
        var childInd=asf.boneData[index].children[i];
        startArray.push(sceneTrajectories[index]);
        endArray.push(sceneTrajectories[childInd]);
        //we need to save start point index and end point index
        var boneLine=getBoneHelper(childInd,asf,sceneTrajectories,startArray,endArray);
        startArray=boneLine.starts;
        endArray=boneLine.ends;
    }
    return {starts:startArray, ends:endArray};
}