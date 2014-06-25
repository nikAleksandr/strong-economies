/*
 * to add
 * -	Highlight()
-	doubleClicked(linkById[d.id])
-	displayTooltip() – executeSearchMatch()
-	linkById[d.id]

 * 
 */

d3.select(window).on("resize", throttle);

/*
var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", move);
   */

var width = document.getElementById('mapContainer').offsetWidth-60;
var height = width / 2;

var typeById = {},
	type2ById = {},
	type3ById = {},
	type4ById = {},
	type5ById = {},
	type6ById = {},
	nameById = {},
	sizeById = {},
	pop2000ById = {},
	pop2013ById = {},
	popGrowthById = {},
	jobs2000ById = {},
	jobs2013ById = {},
	jobsGrowthById = {},
	incPerCapitaById = {},
	unemById = {},
	povById = {},
	eduById = {};

var topo,projection,path,svg,g;
var circles, clickedCircle;
var colorSelection = ['workforce', 'stratPlan', 'entrep', 'inter', 'infra', 'region'];
var popSelection = ['large', 'medium', 'small'];
  
var countyStats = $("#countyStats").hide();

var	typeClasses = d3.scale.threshold()
	.domain([1,2,3,4,5,6,7])
	.range(['noData', 'workforce', 'stratPlan', 'entrep', 'inter', 'infra', 'region']);
	
var	color = d3.scale.threshold()
	.domain([1,2,3,4,5,6,7])
	.range(['none', 'rgb(253,156,2)', 'rgb(0,153,209)', 'rgb(70,200,245)', 'rgb(254,207,47)', 'rgb(102,204,204)', 'rgb(69,178,157)']);

function sizeClasses(d){
	switch(d){
		case 3:
			return "large";
			break;
		case 2:
			return "medium";
			break;
		default:
			return "small";
	}
}

setup(width,height);

function setup(width,height){
  projection = d3.geo.albersUsa()
    .translate([0, 0])
    .scale(width);

  path = d3.geo.path()
      .projection(projection);

  svg = d3.select("#map").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
      //.call(zoom);

  g = svg.append("g");
  
  colorFilterBehavior();
  sizeFilterBehavior();

}

d3.csv("data/EDMapData.csv", function (error, countyData) {
	data = countyData;
	
	countyData.forEach(function(d) { 
	  	typeById[d.id] = +d.TypeNum;
	  	type2ById[d.id] = +d.TypeNum2;
	  	type3ById[d.id] = +d.TypeNum3; 
	  	type4ById[d.id] = +d.TypeNum4; 
	  	type5ById[d.id] = +d.TypeNum5; 
	  	type6ById[d.id] = +d.TypeNum6; 
	  	nameById[d.id] = d.countyState;
	  	sizeById[d.id] = +d.CountySize;
	  	pop2000ById = +d.pop2000;
		pop2013ById = +d.pop2013;
		popGrowthById = +d.popGrowth;
		jobs2000ById = +d.jobs2000;
		jobs2013ById = +d.jobs2013;
		jobsGrowthById = +d.jobsGrowth;
		incPerCapitaById = +d.incPerCap;
		unemById = +d.unem;
		povById = +d.pov;
		eduById = +d.edu;
	});
	
});
	

d3.json("us.json", function(error, us) {

  var counties = topojson.feature(us, us.objects.counties).features;
  var stateMesh = topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; });
  
  topo = counties;
  draw(topo, stateMesh);

});

function draw(topo, stateMesh) {

  var county = g.selectAll(".county").data(topo);
  
  county.enter().insert("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("class", function(d){if(!isNaN(typeById[d.id])){return "county " + "hasData "+ typeClasses(typeById[d.id]);}else{return "county";}});

  g.append("path").datum(stateMesh)
		.attr("id", "state-borders")
		.attr("d", path);
  
  //ofsets plus width/height of transform, plsu 20 px of padding, plus 20 extra for tooltip offset off mouse
  var offsetL = document.getElementById('mapContainer').offsetLeft+(width/2)+40;
  var offsetT =document.getElementById('mapContainer').offsetTop+(height/2)+20;
   
   var makeCircles = d3.select('svg').selectAll("circle").data(topo).enter()
   		.append("circle")
   		.filter(function(d){return typeById[d.id];})
   		.each(function(it){
   			it.properties.r = 10;
   			it.properties.c = path.centroid(it);
   			it.properties.x = width/2;
   			it.properties.y = height/2;	
   			it.properties.fill = color(typeById[it.id]);
   		})
   		.attr("cx", function(it) { return it.properties.x + it.properties.c[0] ;})
   		.attr("cy", function(it) { return it.properties.y + it.properties.c[1] ;})
   		.attr("r", function(it) { if(!isNaN(typeById[it.id])){return it.properties.r;} else{return 0;} })
   		.style("fill", function(it) {if(!isNaN(typeById[it.id])){return color(typeById[it.id]);}else{return 'none';}})
   		.attr("class", function(it){if(!isNaN(typeById[it.id])){return "circle " + "hasData "+ sizeClasses(sizeById[it.id]) + " " + typeClasses(typeById[it.id]) + " "+ typeClasses(type2ById[it.id]) + " active";}else{return "circle";}});
   
   circles = d3.selectAll('circle').filter(function(d){return typeById[d.id];});
   
   // for click and double-click events; for touch devices, use click and double-tap 
	var mdownTime = -1;
	circles.on('mousedown', function(d, i) {
		mdownTime = $.now();
	});

	var clicked = function(d, event) {
		highlight(d);
		if (d3.select('.active').empty() !== true) {
			populateStats(d);
		}		
	};
	
	
	if ($('html').hasClass('no-touch')) {
		circles.each(function(d) {
			d.clickCount = 0;
		});
				
		circles.on('click', function(d) {
			if ($.now() - mdownTime < 300) {
				d3.event.stopPropagation();
				var event = d3.event;
			
				d.clickCount++;
				if (d.clickCount === 1) {
					singleClickTimer = setTimeout(function() {
						d.clickCount = 0;
						clicked(d, event);
					}, 300);
				} else if (d.clickCount === 2) {
					clearTimeout(singleClickTimer);
					d.clickCount = 0;
					doubleClicked(linkById[d.id]);
				}
			}
		});
	} else {
		circles.on('click', function() {
			if ($.now() - mdownTime < 300) {
				d3.event.stopPropagation();
				clicked(d, d3.event);
			}
		});
		
		$('.circle.hasData').addSwipeEvents().bind('doubletap', function(event, touch) {
			event.stopPropagation();
			doubleClicked(linkById[d.id]);
		});
	}
}
//want to make filter objects, one set for colors, another for sizes
function addRemoveCircles(selected, add, selection, otherSelection){
	if(add){
		selection.push(selected);
	}
	else{
		if(selection.length===6){}
		else{
			selection.splice(selection.indexOf(selected), 1);
		}
	}
	
	//console.log(selection + " : " + otherSelection);
	circles.style('display', 'none');
	
	for(i=0; i<selection.length; i++){
		for(j=0; j<otherSelection.length; j++){
			var otherSelectedFilter = otherSelection[j];
			var selectedFilter = selection[i];
			circles.style("display", function(d){
				if(typeClasses(typeById[d.id])===selectedFilter || typeClasses(type2ById[d.id])===selectedFilter || sizeClasses(sizeById[d.id])===selectedFilter){
					//console.log("either " + typeClasses(typeById[d.id]) + " matched " + selectedFilter + " or " + sizeClasses(sizeById[d.id]) + " matched " + selectedFilter);
					if(sizeClasses(sizeById[d.id])===otherSelectedFilter || typeClasses(typeById[d.id])===otherSelectedFilter || typeClasses(type2ById[d.id])===selectedFilter){
						//console.log("either " + typeClasses(typeById[d.id]) + " matched " + otherSelectedFilter + " or " + sizeClasses(sizeById[d.id]) + " matched " + otherSelectedFilter);
						//console.log("matched " + selectedFilter + " : " + otherSelectedFilter);
						return 'inline';
					}
					else{
						var currentCircle = d3.select(this);
						return currentCircle.style();
					}
				}
				else{
					var currentCircle = d3.select(this);
					return currentCircle.style();
				}
			});
		}
	}
}
function colorFilterBehavior(){
	var typeButtons = d3.select("#typeFilters").selectAll(".btn");
	var selectAll = ['workforce', 'stratPlan', 'entrep', 'inter', 'infra', 'region'];
	var add;
	
	typeButtons.on("click", function(){
		var chosen = d3.select(this);
		
		if(!chosen.classed("active")){
			add = true;
			chosen.classed("active", true);
		}
		else{
			switch(colorSelection.length){
				case 6:
					add = true;
					typeButtons.classed("active", false);
					chosen.classed("active", true);
					colorSelection = [];
					break;
				case 1:
					add = false;
					typeButtons.classed("active", true);
					colorSelection = selectAll;
					break;
				default:
					chosen.classed("active", false);
					add = false;
					break;
			}
		}
		addRemoveCircles(chosen.attr('id'), add, colorSelection, popSelection);
	});
}
function sizeFilterBehavior(){
	var popButtons = d3.select("#popFilters").selectAll(".btn");
	var selectAll = ['large', 'medium', 'small'];
	var add;
	
	popButtons.on("click", function(){
		var chosen = d3.select(this);
		
		if(!chosen.classed("active")){
			add = true;
			chosen.classed("active", true);
		}
		else{
			switch(popSelection.length){
				case 5:
				case 4:
				case 3:
					add = true;
					popButtons.classed("active", false);
					chosen.classed("active", true);
					popSelection = [];
					break;
				case 1:
					add = true;
					popButtons.classed("active", true);
					popSelection = selectAll;
					break;
				default:
					chosen.classed("active", false);
					add = false;
					break;
			}
		}
		addRemoveCircles(chosen.attr('id'), add, popSelection, colorSelection);
	});
}
function populateStats(d){
	var countyStatRow = d3.select
	var pop2000,
		popGrowth,
		pop2013;
	
	countyStats.show();
}

function highlight(d) {
	//if (clickedCircle === d) tooltip.classed('hidden', true);
	circles.classed("active", false);
	
	if (d && clickedCircle !== d) {
		clickedCircle = d;
	  } else {
	    clickedCircle = null;
	  }
	
	circles
      .classed("active", clickedCircle && function(d) { return d === clickedCircle; });
    if(clickedCircle === null)circles.classed("active", true);
	
	/*if (frmrActive) frmrActive.style("fill", frmrFill);	
	frmrActive = d3.select(".active");
	if (frmrActive.empty() !== true) {
		frmrFill = frmrActive.style("fill");
		frmrActive.style("fill", null);
	}*/
}
function redraw() {
  width = document.getElementById('mapContainer').offsetWidth-60;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo);
}

/*function move() {

  var t = d3.event.translate;
  var s = d3.event.scale;  
  var h = height / 3;
  
  t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
  t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

  zoom.translate(t);
  g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");

}
*/
var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}