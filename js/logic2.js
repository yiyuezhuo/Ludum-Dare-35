
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
function distance(x1,y1,x2,y2){
	return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
}

/*
function field_inverse(field){
	function _field(x,y){
		var xy=field(x,y);
		return [-xy[0],-xy[1]];
	}
	return _field
}
*/
function field_inverse(field){
	return field.inverse();
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
	
	var newData=data.map(function(d){
		var nxy=field.get(d[0],d[1]);
		if (nxy){
			console.log('use cache');
			return nxy;
		}
		else{
			var dxy=field(d[0],d[1]);
			var nxy=[d[0]+dxy[0]*K,d[1]+dxy[1]*K];
			field.setCacheForward(d,nxy);
			field.setCacheBackward(nxy,d);
			return nxy;
		}
		
		//field.setCacheBackward(nxy,[-dxy[0],-dxy[1]]);
		//return nxy;
	});
	
	return newData;
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

function dataCopy(data){
	var rl=[];
	data.forEach(function(d){
		rl.push([d[0],d[1]]);
	});
	return rl;
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
	/*
	pSelect.append('input').attr('type','text').attr('name',function(d){
		return d;
	})
	*/
	pSelect.append('input').attr('type','range').attr('name',function(d){
		return d;
	})
	.attr('value',function(d){
		return arg[d].value;
	})
	.attr('min',function(d){
		return arg[d].min;
	})
	.attr('max',function(d){
		return arg[d].max;
	})
	.attr('step',function(d){
		return arg[d].step;
	});
		
	function _update(){
		pSelect.selectAll('input').forEach(function(d){
			arg[d[0].name].value=d[0].value;
		})
	}
	
	function _getter(key){
		_update();
		if (key){
			return Number(arg[key]);
		}
		else{
				var rd={};
				argList.forEach(function(key){
					rd[key]={}
					rd[key].value=Number(arg[key].value);
				})
				return rd;
		}
	}
	return _getter;
}

//arg_getter=argBox({k:3,m:2},d3.select('#argField'))
/*
function fieldAbs(args,fieldFamily){
	function _fieldAbs(selection){
		
		var argsGetter=argBox(args,selection);
		
		function fieldGetter(){
			fieldFamily(argsGetter());
		}
		
		return fieldGetter;
	}
}
*/
/*
var codeKeyCut=5;

function codeKey(x,y,args){
	// [1.11111111111,2.2222222222,3.33333333]->[1.111,2.222,3.333] ugly hack for float error and hash bug
	var list=[x,y].concat(args);
	return list.map(function(d){return String(d).slice(0,codeKeyCut)});
}
*/

function fieldAbc(argsList,argsConfig,func){
	// argsList : ['k','b']
	// argsConfig : {k:{value:2,min:1,max:10,step:1},...}
	// func (x,y,arg) -> (dx,dy)
	function _fieldAbs(selection){
		var cacheForward={}; // (x,y,arg1,arg2,...) -> newX,newY (not dx,dy)
		var cacheBackward={};
		var argsGetter=argBox(argsConfig,selection);
		
		function fieldGetter(){
			var argsDict=argsGetter(); //argsDict={k:{value:2,min:1,...},...}
			var args=argsList.map(function(key){return argsDict[key].value}); // args=[1,10,3,...] (argsList order)
			function _field(x,y){
				//var key=codeKey(x,y,args);
				/*
				var key=[x,y]+','+args;
				if(cacheForward[key]){
					//console.log('use forward cache');
					return cacheForward[key];
				}
				else{
					var dxy=func(x,y,argsDict);
					//cacheForward[key]=dxy;
					return dxy;
				}
				*/
				return func(x,y,argsDict);
			}
			function _field_I(x,y){
				//var key=codeKey(x,y,args);
				/*
				var key=[x,y]+','+args;
				if(cacheBackward[key]){
					console.log('use backward cache');
					return cacheBackward[key];
				}
				else{
					var dxy=func(x,y,argsDict);
					cacheBackward[key]=[-dxy[0],-dxy[1]];
					return [-dxy[0],-dxy[1]];
				}
				*/
				var dxy=func(x,y,argsDict);
				return [-dxy[0],-dxy[1]];
			}
			
			function inverseAbs(__field){
				return function(){
					return __field;
				};
			}
			function getAbs(cache){
				// this return new loc direct and maintain cache
				function _get(x,y){
					var key=[x,y]+','+args;
					if(cache[key]){
						return cache[key];
					}
					return undefined;
				}
				return _get;
			}
			function setCacheAbs(cache){
				function setCache(xy,value){
					cache[xy+','+args]=value;
				}
				return setCache;
			}
			
			_field.inverse=inverseAbs(_field_I);
			_field.get=getAbs(cacheForward);
			_field.setCacheForward=setCacheAbs(cacheForward);
			_field.setCacheForward=setCacheAbs(cacheBackward);

			_field_I.inverse=inverseAbs(_field);
			_field_I.get=getAbs(cacheBackward);
			_field_I.setCacheForward=setCacheAbs(cacheBackward);
			_field_I.setCacheForward=setCacheAbs(cacheForward);
		return fieldGetter;
	}
	return _fieldAbs;
}

var field1=fieldAbc(['k'],
							{k:{value:2,min:0,max:10,step:1}},
							function(x,y,args){
								var k=args['k'].value;
								return [k*Math.sin(y),0];
							});
/*
function field1(selection){
	var args={k:{value:2,min:0,max:10,step:1}};
	
	var argsGetter=argBox(args,selection);
	
	function fieldFamily(arg){
		// it show how to process arg in argBox
		var k=arg['k'].value;
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
*/
var field2=fieldAbc(['k'],
							{k:{value:2,min:0,max:10,step:1}},
							function(x,y,args){
								var k=args['k'].value;
								return [k*Math.sin(y),Math.sin(k*x)];
							});

/*
function field2(selection){
	var args={k:{value:2,min:0,max:10,step:1}};
	
	var argsGetter=argBox(args,selection);
	
	function fieldFamily(arg){
		// it show how to process arg in argBox
		var k=arg['k'].value;
		function _field(x,y){
			return [k*Math.sin(y),Math.sin(k*x)];
		}
		return _field;
	}
	
	function _field(){
		return fieldFamily(argsGetter());
	}
	
	return _field;
}
*/

var field3=fieldAbc(['k'],
							{k:{value:2,min:0,max:10,step:1}},
							function(x,y,args){
								var k=args['k'].value;
								return [x*y,x+y];
							});

/*
function field3(selection){
	var args={k:{value:2,min:0,max:10,step:1}};
	
	var argsGetter=argBox(args,selection);
	
	function fieldFamily(arg){
		// it show how to process arg in argBox
		var k=arg['k'].value;
		function _field(x,y){
			return [x*y,x+y];
		}
		return _field;
	}
	
	function _field(){
		return fieldFamily(argsGetter());
	}
	
	return _field;
}
*/


function stageParent(fieldGetter,realArg){
	// selection is master box contain sub input to set arg
	// return run to take a dt and return a new state
	var points;
	var goals;//goals is origin points can not shift its shape
	var heads;//heads is player looked point in the start
	//var args={k:2};
	var K=0.2,duration=100;
	var realArg=realArg;
	
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
	
	function headsInit(goalData){
		var field=fieldGetter(realArg);
		var field_I=field_inverse(field)
		var useField=realArg['time'].value>0 ? field : field_I;
		var useDt=realArg['time'].value>0 ? realArg['time'].value : -realArg['time'].value;
		var data=dataCopy(goalData);
		console.log(realArg['time'].value);
		console.log(useDt);
		d3.range(useDt).forEach(function(d){
			//console.log(data);
			data=moveDataStep(data,K,useField);
		})
		return data;
	}

	
	function init(){
			goals= pointsInit();
			heads=headsInit(goals);
			points=dataCopy(heads);
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
	
	function run(dt,callback){
		var field=fieldGetter();
		var field_I=field_inverse(field);
		//console.log(field);
		var _callback=function(newData){
			// control global assign value in this location
			points=newData;
			if (callback) callback(newData);
		}
		if(dt===0){
			return;
		}
		else if(dt>0){
			moveSeries(points,K,dt,duration,field,_callback);
		}
		else if(dt<0){
			moveSeries(points,K,-dt,duration,field_I,_callback);
		}
	}
	
	function reset(){
		points=dataCopy(heads);
		updatePoints(points,1000);
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
		//console.log(data);
		updateLines(data,duration);
	}
	
	function plot_goal(data){
		data=data || goals;
		updateGoals(data);
	}
	
	function error(){
		var s=d3.sum(d3.zip(points,goals),function(point_goal){
			var point=point_goal[0];
			var goal=point_goal[1];
			var d=distance(point[0],point[1],goal[0],goal[1]);
			//console.log(point);
			//console.log(goal);
			//console.log(d);
			return d;
		});
		//console.log(s);
		return s;
	}
	
	function config(kwargs){
		K=kwargs['K'] || K;
		duration=kwargs['duration']||duration;
		pointsInit=kwargs['pointsInit']||pointsInit;	
		headsInit=kwargs['headsInit']||headsInit;
	}
	
	function _export(kwargs){
		
		config(kwargs)
		init();
		
		var rd={};
		rd.run=run;
		rd.plot_stream=plot_stream;
		rd.plot_goal=plot_goal;
		rd.error=error;
		rd.reset=reset;
		return rd;
	}
	
	//pointInit();
	//init();
	
	return _export;//if return _export() you get deafault value else you can continue config it
}

function stage1(fieldGetter,realArg){
	function pointsInit(){
		// a circle consist of some circles
		var points=[];
		var r=3;
		d3.range(0,Math.PI*2,0.05).forEach(function(i){
			points.push([r*Math.cos(i),r*Math.sin(i)]);
		})
		return points;
	}
	
	var K=0.2;
	var duration=200;

	return stageParent(fieldGetter,realArg)({pointsInit:pointsInit,K:K,duration:duration});
}

function diffSlider(selection,callback){
	lastValue=selection[0][0].value;
	selection.on('change',function(){
		var diff=selection[0][0].value-lastValue;
		lastValue=selection[0][0].value
		callback(diff);
	})
}

function finalInit(initStage,initField,initArg){

	var stage;
	
	/*
	var initStage=initStage || stage1;
	var initField=initField || field1;
	var initArg=initArg || {k:{value:1}};
	
	
	var run=stage.run;
	var plot_stream=stage.plot_stream;
	var plot_goal=stage.plot_goal;
	var error=stage.error;
	*/
	
	var argField=d3.select('#argField');
	var timeInput=d3.select('#timeInput');
	//var buttonRun=d3.select('#buttonRun');
	var buttonPlotStream=d3.select('#buttonPlotStream');
	var buttonHideStream=d3.select('#buttonHideStream');
	var buttonShowGoal=d3.select('#buttonShowGoal');
	var buttonHideGoal=d3.select('#buttonHideGoal');
	var errorText=d3.select('#errorText');
	var buttonReset=d3.select('#buttonReset');
	
	timeInput.attr('value',initArg['time']['value'])
					.attr('min',initArg['time']['min'])
					.attr('max',initArg['time']['max'])
					.attr('step',initArg['time']['step']);
	
	
	//buttonRun.on('click',function(){
	//dtInput.on('drag',function(){
	/*
	buttonRun.on('click',function(){
		var dt=Number(dtInput[0][0].value);
		function callback(){
			var err=stage.error();
			errorText.text(err);
		}
		stage.run(dt,callback);
		//console.log(fit);
	});
	*/
	buttonPlotStream.on('click',function(){
		stage.plot_stream();
	});
	buttonHideStream.on('click',function(){
		stage.plot_stream([]);
	});
	buttonShowGoal.on('click',function(){
		stage.plot_goal();
	});
	buttonHideGoal.on('click',function(){
		stage.plot_goal([]);
	})
	buttonReset.on('click',function(){
		stage.reset();
	})
	
	diffSlider(timeInput,function(dt){
		function callback(){
			var err=stage.error();
			errorText.text(err);
		}
		stage.run(dt,callback);		
	})

	/*
	timeInput.on('change',function(){
		var time=Number(timeInput[0][0].value);
		function callback(){
			var err=stage.error();
			errorText.text(err);
		}
		stage.run(dt,callback);
		//console.log(fit);
	});
	*/
	
	function setter(Stage,Field,realArg){
		stage=Stage(Field(argField),realArg);
	}
	
	setter(initStage,initField,initArg);
	
	return setter;
}

// perherps time=0 is true answer but we can set min/max st it can't in mid loc to confuss player.
//var stageFieldSetter=finalInit(stage1,field1,{k:{value:2},time:{value:5,min:-10,max:10,step:1}});
var stageFieldSetter=finalInit(stage1,field2,{k:{value:2},time:{value:1,min:-10,max:10,step:1}});
//var stageFieldSetter=finalInit(stage1,field3,{k:{value:2},time:{value:1,min:-10,max:10,step:1}});
