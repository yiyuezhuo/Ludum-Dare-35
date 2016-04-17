
var svg=d3.select('svg');

var svg_width=500;
var svg_height=500;

svg.attr('width',svg_width).attr('height',svg_height);
var pointGroup=svg.append('g').classed('points',true);
var streamGroup=svg.append('g').classed('stream',true);
var goalGroup=svg.append('g').classed('points',true);

var xScale=d3.scale.linear().domain([-10,10]).range([0,svg_width]);
var yScale=d3.scale.linear().domain([-10,10]).range([svg_height,0]);

/*
function test_field(x,y){
	// (x,y) -> (dx,dy)
	return [1,0];
}

function test_field2(x,y){
	// (x,y) -> (dx,dy)
	return [Math.sin(y),0];
}
*/

function field_inverse(field){
	function _field(x,y){
		var xy=field(x,y);
		return [-xy[0],-xy[1]];
	}
	return _field
}


/*
function test_points_init(){
	// a circle consist of some circles
	var points=[];
	var r=3;
	d3.range(0,Math.PI*2,0.05).forEach(function(i){
		points.push([r*Math.cos(i),r*Math.sin(i)]);
	})
	return points;
}
*/

function locPoint(selection){
	selection
	.attr('cx',function(d){
		return xScale(d[0]);
	}).attr('cy',function(d){
		return yScale(d[1]);
	})
}

function locLine(selection){
	selection
	.attr('x1',function(d){
		return xScale(d.x);
	})
	.attr('y1',function(d){
		return yScale(d.y);
	})
	.attr('x2',function(d){
		return xScale(d.x+d.dx);
	})
	.attr('y2',function(d){
		return yScale(d.y+d.dy);
	})
}

function updatePoints(data,duration){
	var points=pointGroup.selectAll('circle').data(data);
	var r=1.5;
	duration =duration || 1000;
	points.enter().append('circle').attr('r',r).call(locPoint);
	points.transition().ease('linear').duration(duration).call(locPoint);
	points.exit().remove();
}

function updateGoals(data,duration){
	var points=goalGroup.selectAll('circle').data(data);
	var r=1.5;
	duration =duration || 1000;
	points.enter().append('circle').attr('r',r).call(locPoint);
	points.transition().ease('linear').duration(duration).call(locPoint);
	points.exit().remove();
}


function updateLines(data,duration){
	var lines=streamGroup.selectAll('line').data(data);
	
	duration=duration || 1000;
	lines.enter().append('line').style("stroke","rgb(99,99,99)").style("stroke-width","1").call(locLine);
	lines.transition().ease('linear').duration(duration).call(locLine);
	lines.exit().remove();
}

/*
var test_points;

function test_init(){
	test_points= test_points_init();
	updatePoints(test_points);
	return test_points;
}

test_points=test_init();
*/

function moveDataStep(data,K,field){
	var field=field// || test_field;
	
	K=K || 1;
	
	return data.map(function(d){
		var dxy=field(d[0],d[1]);
		return [d[0]+dxy[0]*K,d[1]+dxy[1]*K];
	});
}

function moveSVGStep(newData,duration){
	updatePoints(newData,duration);
}

function runToEnd(func,pred,time,endCallback){
	/*
	run func to pred return true
	*/
	var label;
	var _f=function(){
		func()
		if (pred()) {
			clearInterval(label);
			if (endCallback){
				endCallback();
			}
		};
	}
	label=setInterval(_f,time);
}


function moveSeries(data,K,N,duration,field,callback){
	// data is old data 
	// K is step long
	// N is iter count
	// duration is time for a iteration
	// callback used to return newData information beacause it can't proper work by direct return it
	var i,newData=data;
	var func=function(){
		newData=moveDataStep(newData,K,field);
		moveSVGStep(newData,duration);
	}
	var count=0;
	var pred=function(){
		count+=1;
		return count+1>N;
	}
	var time=duration;
	var endCallback=function(){
		callback(newData);
	}
	runToEnd(func,pred,time,endCallback);
	//return newData;
}

/*
function test_UI_init(){
	var field=test_field2;
	var field_I=field_inverse(field);
	var callback=function(newData){
		// control global assign value in this location
		test_points=newData;
	}
	d3.select('#test_field').on('click',function(){
		moveSeries(test_points,0.2,10,100,field,callback);
	});
	d3.select('#test_field_I').on('click',function(){
		moveSeries(test_points,0.2,10,100,field_I,callback);
	});
}

test_UI_init();
*/

function test_field_family(arg){
	// it show how to process arg in argBox
	var k=arg['k'];
	function _field(x,y){
		return [k*Math.sin(y),0];
	}
}


function argBox(arg,selection){
	// arg={'k':1,...} 1 is init value
	// selection=d3.selections master its selectAll(...) contain input or other same wight
	// return getter , you can use it to get last value
	
	var key;
	
	var argList=[];
	for (key in arg){
		argList.push(key);
	}
	selection.selectAll('p').remove();
	
	var pSelect=selection.selectAll('p').data(argList).enter().append('p');
	pSelect.append('span').text(function(d){
		return d;
	});
	pSelect.append('input').attr('type','text').attr('name',function(d){
		return d;
	})
	.attr('value',function(d){
		return arg[d];
	});
		
	function _update(){
		pSelect.select('input').forEach(function(d){
			arg[d[0].name]=d[0].value;
		})
	}
	
	function _getter(key){
		_update();
		if (key){
			return Numer(arg[key]);
		}
		else{
				var rd={};
				argList.forEach(function(key){
					rd[key]=Number(arg[key]);
				})
				return rd;
		}
	}
	return _getter;
}

//arg_getter=argBox({k:3,m:2},d3.select('#argField'))

function field1(selection){
	var args={k:2};
	
	var argsGetter=argBox(args,selection);
	
	function fieldFamily(arg){
		// it show how to process arg in argBox
		var k=arg['k'];
		function _field(x,y){
			return [k*Math.sin(y),0];
		}
		return _field;
	}
	
	function _field(){
		return fieldFamily(argsGetter());
	}
	
	return _field;
}

function stage1(fieldGetter){
	// selection is master box contain sub input to set arg
	// return run to take a dt and return a new state
	var points;
	var goals;//goals is origin points can not shift its shape
	//var args={k:2};
	var K=0.2,duration=100;
	
	//argsGetter=argBox(args,selection);
	
	function pointsInit(){
		// a circle consist of some circles
		var points=[];
		var r=3;
		d3.range(0,Math.PI*2,0.05).forEach(function(i){
			points.push([r*Math.cos(i),r*Math.sin(i)]);
		})
		return points;
	}
	
	function init(){
			points= pointsInit();
			goals=[];
			points.forEach(function(d){
				goals.push([d[0],d[1]]);
			});
			updatePoints(points);
			return points;
	}
	
	/*
	function fieldFamily(arg){
			// it show how to process arg in argBox
		var k=arg['k'];
		function _field(x,y){
			return [k*Math.sin(y),0];
		}
		return _field;
	}
	*/
	
	function run(dt){
		var field=fieldGetter();
		var field_I=field_inverse(field);
		//console.log(field);
		var callback=function(newData){
			// control global assign value in this location
			points=newData;
		}
		if(dt===0){
			return;
		}
		else if(dt>0){
			moveSeries(points,K,dt,duration,field,callback);
		}
		else if(dt<0){
			moveSeries(points,K,-dt,duration,field_I,callback);
		}
	}
	
	function plot_stream(data){
		// data=[] => remove stream plot
		var field=fieldGetter();
		//var data=[];
		var duration=500;
		if (!(data)){
			data=[];
			d3.range(-10,10,1).forEach(function(x){
				d3.range(-10,10,1).forEach(function(y){
					dxy=field(x,y);
					data.push({x:x,y:y,dx:dxy[0]*K,dy:dxy[1]*K});
				})
			})
		}
		console.log(data);
		updateLines(data,duration);
	}
	
	function plot_goal(data){
		data=data || goals;
		updateGoals(data);
	}
		
	//pointInit();
	init();
	
	var rd={};
	rd.run=run;
	rd.plot_stream=plot_stream;
	rd.plot_goal=plot_goal;
	return rd;
}

function otherInit(){
	
	var initStage=stage1;
	var initField=field1;
	
	var stage=initStage(initField(d3.select('#argField')));
	var run=stage.run;
	var plot_stream=stage.plot_stream;
	var plot_goal=stage.plot_goal;
	
	var dtInput=d3.select('#dtInput');
	var buttonRun=d3.select('#buttonRun');
	var buttonPlotStream=d3.select('#buttonPlotStream');
	var buttonHideStream=d3.select('#buttonHideStream');
	var buttonShowGoal=d3.select('#buttonShowGoal');
	var buttonHideGoal=d3.select('#buttonHideGoal');
	
	buttonRun.on('click',function(){
		var dt=Number(dtInput[0][0].value);
		run(dt);
	});
	buttonPlotStream.on('click',function(){
		plot_stream();
	});
	buttonHideStream.on('click',function(){
		plot_stream([]);
	});
	buttonShowGoal.on('click',function(){
		plot_goal();
	});
	buttonHideGoal.on('click',function(){
		plot_goal([]);
	})
}


otherInit();