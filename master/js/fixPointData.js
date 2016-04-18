fixPointDataDict={
	's1':[{x:1,y:1},{x:2,y:2},{x:3,y:-1},{x:4,y:0},{x:5,y:3},{x:6,y:-3}],
}

!function(){
	var fixPointData;
	fixPointData=[];
	d3.range(1,20,0.1).forEach(function(i){
		fixPointData.push({x:i,y:Math.random()*10-5});
	});
	fixPointDataDict['massive']=fixPointData;
	
	fixPointData=[];
	d3.range(1,20,1).forEach(function(i){
		fixPointData.push({x:i,y:2});
	});
	fixPointDataDict['upper']=fixPointData;
}();