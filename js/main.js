d3.select(window).on("resize", throttle);

/*
var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", move);
   */

var width = document.getElementById('container').offsetWidth-60;
var height = width / 2;

var typeById = {},
	nameById = {},
	sizeById = {};

var topo,projection,path,svg,g, circles, colorSelection = ['workforce', 'stratPlan', 'entrep', 'inter', 'infra', 'region'];

var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

var	colorClasses = d3.scale.threshold()
	.domain([1,2,3,4,5,6,7])
	.range(['noData', 'workforce', 'stratPlan', 'entrep', 'inter', 'infra', 'region']);

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

}

d3.csv("data/EDMapData.csv", function (error, countyData) {
	data = countyData;
	
	countyData.forEach(function(d) { 
	  	typeById[d.id] = +d.TypeNum; 
	  	nameById[d.id] = d.countyState;
	  	sizeById[d.id] = +d.CountySize;
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
      .attr("class", function(d){if(!isNaN(typeById[d.id])){return "county " + "hasData "+ colorClasses(typeById[d.id]);}else{return "county";}});

  g.append("path").datum(stateMesh)
		.attr("id", "state-borders")
		.attr("d", path);
  
  //ofsets plus width/height of transform, plsu 20 px of padding, plus 20 extra for tooltip offset off mouse
  var offsetL = document.getElementById('container').offsetLeft+(width/2)+40;
  var offsetT =document.getElementById('container').offsetTop+(height/2)+20;

  //tooltips
  county
    .on("mousemove", function(d,i) {
      var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
        tooltip
          .classed("hidden", false)
          .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
          .html(d.properties.name);
      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true);
      }); 
   
   var makeCircles = d3.select('svg').selectAll("circle").data(topo).enter()
   		.append("circle")
   		.each(function(it){
   			it.properties.r = sizeById[it.id]*2 + 13;
   			it.properties.c = path.centroid(it);
   			it.properties.x = width/2;
   			it.properties.y = height/2;	
   			//it.properties.class = color(typeById[it.id]);
   		})
   		.attr("cx", function(it) { return it.properties.x + it.properties.c[0] ;})
   		.attr("cy", function(it) { return it.properties.y + it.properties.c[1] ;})
   		.attr("r", function(it) { if(!isNaN(typeById[it.id])){return it.properties.r;} else{return 0;} })
   		.attr("class", function(it){if(!isNaN(typeById[it.id])){return "circle " + "hasData "+ sizeClasses(sizeById[it.id]) + " " + colorClasses(typeById[it.id]);}else{return "county";}});
   
   circles = d3.selectAll('circle');
}
//want to make filter objects, one set for colors, another for sizes
function addRemoveCircles(selected, add){
	if(add){
		colorSelection.push(selected);
	}
	else{
		colorSelection.splice(colorSelection.indexOf(selected), 1);
	}
	
	
	circles.style('display', 'none');
	
	for(i=0; i<colorSelection.length; i++){
		var selectedFilter = colorSelection[i];
		circles.style("display", function(d){
			if(colorClasses(typeById[d.id])===selectedFilter){
				return 'inline';
			}
			else{
				var currentCircle = d3.select(this);
				return currentCircle.style();
			}
		});
	}
}
function colorFilterBehavior(){
	var typeButtons = d3.select("#typeFilters").selectAll(".btn");
	console.log(typeButtons);
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
					add = true;
					typeButtons.classed("active", true);
					colorSelection = selectAll;
					break;
				default:
					chosen.classed("active", false);
					add = false;
					break;
			}
			
		}
		addRemoveCircles(chosen.attr('id'), add);
	});
	
}

function redraw() {
  width = document.getElementById('container').offsetWidth-60;
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