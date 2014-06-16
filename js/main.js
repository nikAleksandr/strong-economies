d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", move);

var width = document.getElementById('container').offsetWidth-60;
var height = width / 2;

var typeById = {},
	nameById = {};

var topo,projection,path,svg,g;

var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

var	color = d3.scale.threshold()
	.domain([0,1,2,3,4,5,6,7])
	.range(['rgb(228,26,28)','rgb(55,126,184)','rgb(77,175,74)','rgb(152,78,163)','rgb(255,127,0)','rgb(255,255,51)','rgb(166,86,40)']);

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
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .call(zoom);

  g = svg.append("g");

}

d3.csv("data/EDMapData.csv", function (error, countyData) {
	data = countyData;
	
	countyData.forEach(function(d) { 
	  	typeById[d.id] = +d.TypeNum; 
	  	nameById[d.id] = d.countyState;
	});
	
});
	

d3.json("us.json", function(error, us) {

  var counties = topojson.feature(us, us.objects.counties).features;

  topo = counties;
  draw(topo);

});

function draw(topo) {

  var county = g.selectAll(".county").data(topo);

  county.enter().insert("path")
      .attr("class", "county")
      .classed("hasData", function(d){return !isNaN(typeById[d.id]);} )
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .style("fill", function(d) { if(!isNaN(typeById[d.id])){return color(typeById[d.id]);} else{return "#ccc";} });

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
   			it.properties.r = 20;
   			it.properties.c = path.centroid(it);
   			it.properties.x = width/2;
   			it.properties.y = height/2;	
   			it.properties.fill = color(typeById[it.id]);
   		})
   		.attr("cx", function(it) { return it.properties.x + it.properties.c[0] ;})
   		.attr("cy", function(it) { return it.properties.y + it.properties.c[1] ;})
   		.attr("r", function(it) { if(!isNaN(typeById[it.id])){return it.properties.r;} else{return 0;} })
   		.style("fill", function(it){ return it.properties.fill;});
   
}

function redraw() {
  width = document.getElementById('container').offsetWidth-60;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo);
}

function move() {

  var t = d3.event.translate;
  var s = d3.event.scale;  
  var h = height / 3;
  
  t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
  t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

  zoom.translate(t);
  g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");

}

var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}