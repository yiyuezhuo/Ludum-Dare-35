
var svg=d3.select('svg');

var svg_width=400;
var svg_height=400;

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

function setRange(selection,dic){
	var dom=selection[0][0];
	dom.value=dic['value'];
	dom.min=dic['min'];
	dom.max=dic['max'];
	dom.step=dic['step'];
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
				setTimeout(endCallback,time*2);
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




function fieldAbc(argsList,argsConfig,func){
	// argsList : ['k','b']
	// argsConfig : {k:{value:2,min:1,max:10,step:1},...}
	// func (x,y,arg) -> (dx,dy)
	function _fieldAbs(selection){
		var cacheForward={}; // (x,y,arg1,arg2,...) -> newX,newY (not dx,dy)
		var cacheBackward={};
		var argsGetter=argBox(argsConfig,selection);
		
		function fieldGetter(argsDict){
			var argsDict=argsDict || argsGetter(); //argsDict={k:{value:2,min:1,...},...}
			var args=argsList.map(function(key){return argsDict[key].value}); // args=[1,10,3,...] (argsList order)
			function _field(x,y){
				return func(x,y,argsDict);
			}
			function _field_I(x,y){
				var dxy=func(x,y,argsDict);
				return [-dxy[0],-dxy[1]];
			}
			
			function inverseAbs(__field){
				return function(){
					return __field;
				}
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
			_field.setCacheBackward=setCacheAbs(cacheBackward);

			_field_I.inverse=inverseAbs(_field);
			_field_I.get=getAbs(cacheBackward);
			_field_I.setCacheForward=setCacheAbs(cacheBackward);
			_field_I.setCacheBackward=setCacheAbs(cacheForward);
			
			return _field;
		}
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

var field2=fieldAbc(['k'],
							{k:{value:2,min:0,max:10,step:1}},
							function(x,y,args){
								var k=args['k'].value;
								return [k*Math.sin(y),Math.sin(k*x)];
							});

var field3=fieldAbc(['k'],
							{k:{value:2,min:0,max:10,step:1}},
							function(x,y,args){
								var k=args['k'].value;
								return [x*y*k,x+y*k];
							});

var field4=fieldAbc(['k'],
							{k:{value:2,min:0,max:10,step:1}},
							function(x,y,args){
								var k=args['k'].value;
								return [x*x*y,x*k-y];
							});
							
var field5=fieldAbc(['k'],
							{k:{value:2,min:0,max:10,step:1}},
							function(x,y,args){
								var k=args['k'].value;
								return [x*Math.sin(y),Math.cos(x)*k+y*y];
							});





function stageParent(fieldGetter,realArg){
	// selection is master box contain sub input to set arg
	// return run to take a dt and return a new state
	var points;
	var goals;//goals is origin points can not shift its shape
	var heads;//heads is player looked point in the start
	//var args={k:2};
	var K=0.2,duration=100;
	//var realArg=realArg;
	
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
			var d=distance(point[0],point[1],goal[0],goal[1])/points.length;
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

function stage2(fieldGetter,realArg){
	function pointsInit(){
		// a circle consist of some circles
		return bGraph;
	}
	
	var K=0.2;
	var duration=200;

	return stageParent(fieldGetter,realArg)({pointsInit:pointsInit,K:K,duration:duration});
}

function stage3(fieldGetter,realArg){
	function pointsInit(){
		// a circle consist of some circles
		return chikenGraph;
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

function gamePageInitConfig(passCallback){
	function gamePageInit(initStage,initField,initArg){

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
		
		
		function setter(Stage,Field,realArg){
			/*
			timeInput.attr('value',realArg['time']['value'])
				.attr('min',realArg['time']['min'])
				.attr('max',realArg['time']['max'])
				.attr('step',realArg['time']['step']);
			*/
			//var timeDom=timeInput[0][0];
			setRange(timeInput,realArg['time']);
				
			diffSlider(timeInput,function(dt){
				function callback(){
					var err=stage.error();
					errorText.text(err);
					if(err<1e-2){
						passCallback();
					}
				}
				stage.run(dt,callback);		
			})

			stage=Stage(Field(argField),realArg);
		}
		
		setter(initStage,initField,initArg);
		
		return setter;
	}
	return gamePageInit;
}




// perherps time=0 is true answer but we can set min/max st it can't in mid loc to confuss player.
//var stageFieldSetter=finalInit(stage1,field1,{k:{value:2},time:{value:5,min:-10,max:10,step:1}});
//var stageFieldSetter=finalInit(stage1,field2,{k:{value:2},time:{value:1,min:-10,max:10,step:1}});
var stageFieldSetter=gamePageInitConfig(function(){
	passCallback();
});


var gamePage=d3.select('#gamePage');
var welcomePage= d3.select('#welcomePage');
var jumpPage=d3.select('#jumpPage');
var victoryPage=d3.select('#victoryPage');
var flashDialog=d3.select('#flashDialog')

var buttonStartGame=d3.select('#buttonStartGame')
var buttonNextStage=d3.select('#buttonNextStage');
var audio=d3.select('#audioDoom');
var buttonReturn= d3.select('#buttonReturn');
var gamePageHeader=d3.select('#gamePageHeader');
var flashContent=d3.select('#flashContent');
var flashButton=d3.select('#flashButton');


function pageInit(){
	
	
	function welcomePageInit(){
		buttonStartGame.on('click',function(){
			var stageRecord=nextStage();
			
			stageFieldSetter(stageRecord['stage'],stageRecord['field'],stageRecord['realArg']);
			gamePageHeader.text(stageRecord['name']);
			flashContent.text(stageRecord['flash']);

			welcomePage.style('display','none');
			gamePage.style('display','block');
			flashDialog.style('display','block');
		})
	}

	function jumpPageInit(){
		buttonNextStage.on('click',function(){
			jumpPage.style('display','none');
			flashDialog.style('display','block');
			gamePage.style('display','block');
		})
	}
	
	function victoryPageInit(){
		buttonReturn.on('click',function(){
			audio[0][0].play();
		})
	}
	
	flashButton.on('click',function(){
		flashDialog.style('display','none');
	});
	
	welcomePageInit();
	jumpPageInit();
	victoryPageInit();
	
	
}


//gamePage.style('display','block');




function nextStageIteration(){
	var i=0;
	
	var stageList=[
		{stage:stage1,field:field1,realArg:{k:{value:2},time:{value:5,min:-10,max:10,step:1}},
		name:"I'm circle I",flash:"I am a happy circle live in pixel kindom,but my shape is shifted by field! You can drag below time bar to middle to rollback and resume my pefect body."},
		{stage:stage1,field:field2,realArg:{k:{value:2},time:{value:-8,min:-12,max:8,step:1}},
		name:"I'm circle II",flash:"It's not middle loction again,find the proper location"},
		{stage:stage1,field:field3,realArg:{k:{value:1},time:{value:1,min:-10,max:10,step:1}},
		name:"I'm circle III",flash:"the field change! You can look stream plot to pick proper field rollback to a circle.Tip:it looks so big?"},
		{stage:stage2,field:field4,realArg:{k:{value:3},time:{value:6,min:-10,max:10,step:1}},
		name:"I'm ???",flash:"you can hit 'plot goal' to see you need to fit."},
		{stage:stage3,field:field2,realArg:{k:{value:4},time:{value:4,min:-15,max:10,step:1}},
		name:"I'm chiken",flash:"CHIKEN!"}
	]
	
	//stageList=[stageList[4]]
	
	function _next(){
		var r=stageList[i];
		i+=1;
		return r;
	}
	return _next;
}

var nextStage=nextStageIteration();

function passCallback(){

	var stageRecord=nextStage();
	
	flashDialog.style('display','none');
	if (stageRecord){
		gamePage.style('display','none');
		jumpPage.style('display','block');

		stageFieldSetter(stageRecord['stage'],stageRecord['field'],stageRecord['realArg']);
		gamePageHeader.text(stageRecord['name']);
		flashContent.text(stageRecord['flash']);
	}
	else{
		gamePage.style('display','none');
		jumpPage.style('display','block');
		buttonNextStage.on('click',function(){
		jumpPage.style('display','none');
		victoryPage.style('display','block');
		})
	}
}

pageInit();

welcomePage.style('display','block');