
var svg= d3.select('#svg');
var inputFormula= d3.select('#inputFormula');
var buttonApply=d3.select('#buttonApply');
var runPoint=d3.select('#runPoint');

var svg_width=500;
var svg_height=500;
//var svg_margin=50;
var svg_margin=30;


svg.attr('width',svg_width).attr('height',svg_height);

var fixPoint=svg.append('g').classed('fixPoint',true);
var dynPoint=svg.append('g').classed('dynPoint',true);

// plot axis

var xScale=d3.scale.linear().domain([0,20]).range([0,400]);
var yScale=d3.scale.linear().domain([-10,10]).range([400,0]);

var xAxis=d3.svg.axis()
				.scale(xScale)
				.orient('bottom');
var yAxis=d3.svg.axis()
				.scale(yScale)
				.orient('left');
				
				
svg.append('g').attr('class','x-axis axis').attr('transform',function(){ 
                return "translate(" + svg_margin + "," + (svg_height - svg_margin)/2 + ")";
            }).call(xAxis);
			
svg.append('g').attr('class','y-axis axis').attr('transform',function(){ 
                return "translate(" + svg_margin + "," + svg_margin + ")";
            }).call(yAxis);
			
// plot text circle

//var fixPointData=[{x:1,y:1},{x:2,y:2},{x:3,y:-1},{x:4,y:0},{x:5,y:3},{x:6,y:-3}];

/*
var fixPointData=[];
d3.range(0,20,0.1).forEach(function(i){
	fixPointData.push({x:i,y:Math.random()*10-5});
})
*/

var fixPointData=fixPointDataDict['upper'];

function locCircle(selection){
	return selection.attr('cx',function(d){
								return xScale(d.x);
							})
							.attr('cy',function(d){
								return yScale(d.y);
							})
							.attr('class','dot')
							.attr('r',1.5)
							.attr('transform',function(){ 
                return "translate(" + svg_margin + "," + svg_margin + ")";
            });
}

function updateCircle(data){
	var circles=fixPoint.selectAll('circle').data(data);
	circles.enter().append('circle').call(locCircle);
	circles.transition().call(locCircle);
	circles.exit().remove();
}

updateCircle(fixPointData);

							
var testLinkFunc=function(x){
	return 5*Math.sin(x);
}

var applyLink=function(linkFunc,data){
	var newData=[];
	data.forEach(function(d){
		newData.push({x:d.x,y:linkFunc(d.x)});
	})
	return newData;
}

function testUpdateLink(){
	fixPointData=applyLink(testLinkFunc,fixPointData);
	updateCircle(fixPointData);
}

//test field

d3.select('#testButton').on('click',function(){
	testUpdateLink();
})

// run point

function distance(x1,y1,x2,y2){
	return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
}

function forceNewton(point,d){
	var K1=1;
	var r=distance(point.x,point.y,d.x,d.y);
	ddx_s=(d.x-point.x)*K1/Math.pow(r,2);
	ddy_s=(d.y-point.y)*K1/Math.pow(r,2);
	return [ddx_s,ddy_s]
}
function forceNewton1(point,d){
	var K1=1;
	var r=distance(point.x,point.y,d.x,d.y);
	ddx_s=(d.x-point.x)*K1/r //Math.pow(r,2);
	ddy_s=(d.y-point.y)*K1/r //Math.pow(r,2);
	return [ddx_s,ddy_s]
}

var useForce=forceNewton1;

function moveStepData(point,other,kwargs){
	/*
	parameter:
		point={x:num,y:num,dx:num,dy:num}
		other=[{x:num,y:num},...]
	return:
		point={x:num,y:num,dx:num,dy:num}
	*/
	kwargs=kwargs||{};
	var K1=kwargs.K1 || 1;
	var K2=kwargs.K2 || 1;
	var K3=kwargs.K3 || 1;
	
	var ddx=0,ddy=0;
	other.forEach(function(d){
		/*
		var r=distance(point.x,point.y,d.x,d.y);
		ddx+=(d.x-point.x)*K1/Math.pow(r,2);
		ddy+=(d.y-point.y)*K1/Math.pow(r,2);
		*/
		ddxy=useForce(point,d);
		ddx+=ddxy[0];
		ddy+=ddxy[1];
	});
	var dx=point.dx+ddx*K2;
	var dy=point.dy+ddy*K2;
	return {x:point.x+dx*K3,y:point.y+dy*K3,dx:dx,dy:dy};
}

function runToEnd(func,pred,time){
	/*
	run func to pred return true
	*/
	var label;
	var _f=function(){
		func()
		if (pred()) clearInterval(label);
	}
	label=setInterval(_f,time);
}

function moveStepDom(selection,duration,point,other,kwargs){
	var newPoint=moveStepData(point,other,kwargs)
	selection.data([newPoint]).transition().ease('linear').duration(duration).call(locCircle);
	return newPoint;
}

function test_flow(n,duration,kwargs){
	var i;
	var initPointData={x:0,y:0,dx:0,dy:0}
	
	// clear pre for retry
	dynPoint.selectAll('circle').remove();
	
	var selection=dynPoint.selectAll('circle').data([initPointData]).enter().append('circle');
	selection.call(locCircle);
	var callPoint=initPointData;
	var func=function(){
		callPoint=moveStepDom(selection,duration,callPoint,fixPointData,kwargs);
	}
	var count=0;
	var pred=function(){
		count+=1;
		return count+1>n;
	}
	var time=duration;
	runToEnd(func,pred,time);
}

function evalMath(fs,x,y,z){
	var sin=Math.sin;
	var cos=Math.cos;
	var tan=Math.tan;
	var exp=Math.exp;
	var log=Math.log;
	var pow=Math.pow;
	var pi=Math.PI;
	var PI=Math.PI;
	fs=fs.replace('**','^');
	var fs_=fs.replace(/(\w+|\(.+\))\^(\w+|\(.+\))/,'pow($1,$2)')
	while(fs!==fs_){
		fs=fs_;
		fs_=fs_.replace(/(\w+|\(.+\))\^(\w+|\(.+\))/,'pow($1,$2)')
	}
	//fs=fs.replace(/(\w+)\^(\w+)/,"pow($1,$2)");
	return eval(fs);//fs string contain variable x,Math.etc...;
}

buttonApply.on('click',function(){
	var fs=inputFormula[0][0].value;//fuck d3 for my debug time, however it's wrong in jQuery too.
	var linkFunc=function(x){
		return evalMath(fs,x);
	}
	fixPointData=applyLink(linkFunc,fixPointData);
	updateCircle(fixPointData);
})

runPoint.on('click',function(){
	test_flow(100,100,{K3:0.1});
})