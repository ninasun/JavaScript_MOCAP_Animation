function parseASF(file){
	var lines=file.split("\n")
	//console.log(lines[0]);
	var asfObj={version:0, name:null, units:{},documentation:null,root:null,boneData:[],boneNames:[]};
	for (var i=0;i<lines.length;i++){
		var fields=lines[i].match(/\S+/g);
		if (lines[i][0]=='#')
			continue;
		else if (lines[i][0]==':'){
			if (lines[i].indexOf("version")!=-1){
				asfObj.version=fields[1];
			}
			else if (lines[i].indexOf("name")!=-1){
				asfObj.name=fields[1];
			}
			else if (lines[i].indexOf("units")!=-1){
				unitsObj={};
				while(lines[i].indexOf("documentation")==-1){
					var fields=lines[i].match(/\S+/g);
					if(fields[0]!=":units"){
						unitsObj[fields[0]]=isNaN(parseFloat(fields[1])) ? fields[1] : parseFloat(fields[1]);
					}
					i++;
				}
				i--;
				asfObj.units=unitsObj;
			}
			else if (lines[i].indexOf("documentation")!=-1){
				asfObj.documentation=lines[i+1]+lines[i+2]
				i=i+2;
				//lines 8,9,10 in original?
			}
			else if (lines[i].indexOf("root")!=-1){
				rootObj={};
				while(lines[i].indexOf("bonedata")==-1){
					var fields=lines[i].match(/\S+/g);
					if(fields[0]!=":root"){
				 		var label=fields.shift();
				 		if(label=="axis"){ rootObj[label]=fields[0];}
				 		else{
				 			var value=[];
				 			for(j=0; j<fields.length; j++){
				 				value[j]=isNaN(parseFloat(fields[j])) ? fields[j] : parseFloat(fields[j]);
				 			}
						rootObj[label]=value;
						}
					}
					i++;
				}
				rootObj.name="root";
				i--;
				asfObj.root=rootObj;
			}
			else if (lines[i].indexOf("bonedata")!=-1){

				[asfObj.boneData, asfObj.boneNames,i]=parseBones(lines,i);
				asfObj.boneData.unshift(asfObj.root);
				asfObj.boneNames.unshift("root");
			}
			else if (lines[i].indexOf("hierarchy")!=-1){

				while(lines[i].match(/\S+/g)[0]!="end"){
					fields=lines[i].match(/\S+/g);
					if(fields[0]!="begin" && fields[0]!=":hierarchy"){
						var parent=fields.shift();
						var children=[];
						for(j=0; j<fields.length; j++){
							// save the indices of the children
							children[j]=asfObj.boneNames.indexOf(fields[j]);
						}
						asfObj.boneData[asfObj.boneNames.indexOf(parent)].children=children;
					}
					i++;
				}
			}
		}
	}
	console.log(asfObj);
	return asfObj;

}

function Bone(){
	this.id=NaN;
	this.name=NaN;
	this.direction=[];
	this.length=NaN;
	this.axis=[];
	this.limits=[];
	this.dof=[];
	this.rotationOrder=NaN;
	this.children=[];
}

function parseBones(lines,i){
	var boneData=[];
	var boneNames=[];
	while(lines[i].indexOf("hierarchy")==-1){
	var fields=lines[i].match(/\S+/g);
		if(fields[0]=="begin")
			var bone=new Bone();
		else if(fields[0]=="end")
		// 	boneData[bone.name]=bone;
			boneData.push(bone);
		else if(fields[0]=="id")
			bone.id=parseFloat(fields[1]);
		else if(fields[0]=="name"){
			bone.name=fields[1];
			boneNames.push(fields[1]);
			}
		else if(fields[0]=="direction"){
			fields.shift();
			for(var j=0; j<fields.length; j++){
				fields[j]=parseFloat(fields[j]);
			}
			bone.direction=fields;
		}
		else if(fields[0]=="length")
			bone.length=parseFloat(fields[1]);
		else if(fields[0]=="axis"){
			fields.shift();
			bone.rotationOrder=fields.pop();
			for(var j=0; j<fields.length; j++){
				fields[j]=parseFloat(fields[j]);
			}
			bone.axis=fields;
		}
		else if(fields[0]=="dof"){
			fields.shift();
			bone.dof=fields;
		}
		else if(fields[0]=="limits"){
			var limits=[parseFloat(fields[1].split("(")[1])];
		 	limits.push(parseFloat(fields[2].split(")")[0]));
		 	bone.limits=[limits];
			for(var j=0; j<bone.dof.length-1; j++){
				i++;
				limits=lines[i].match(/[+-]?\d+\.\d+/g);
				for(var k=0; k<limits.length; k++){
					limits[k]=parseFloat(limits[k]);
				}
				bone.limits.push(limits);
			}
		}
		i++;
	}
	i--;
	return [boneData,boneNames, i];
}