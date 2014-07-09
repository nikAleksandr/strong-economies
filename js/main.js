d3.select(window).on("resize", throttle);
//popover js
function toTitleCase(str){ return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}); }
function setDefinitionBehavior(){
	$('.popover-dismiss').popover({trigger: 'click, hover'});
}

// formatting for the tooltip
var format = {
	"percent": function(num, type){
		if(type === 'growth') return d3.format('+.1%')(num);
		else return d3.format('.1%')(num);
	},
	"binary": function (num) { return num; },
	"categorical": function (num) { return num; },
	"level": function (num, type) {
		if (type === 'year') return num;
    	else if (num >= 1000000000) {
    		var formatted = String((num/1000000000).toFixed(1)) + " Bil";
    		return (type === 'currency') ? '$' + formatted : formatted;
    	} else if (num >= 1000000) {
    		var formatted = String((num/1000000).toFixed(1)) + " Mil";
    		return (type === 'currency') ? '$' + formatted : formatted;
    	} else if (num >= 10000) {
    		var formatted = String((num/1000).toFixed(1)) + "k";
    		return (type === 'currency') ? '$' + formatted : formatted;
    	} else if (num >= 100) {
    		return (type === 'currency') ? d3.format('$,.0f')(num) : d3.format(',.0f')(num);
    	} else if (num == 0) {
    		return (type === 'currency') ? '$0' : 0;
    	} else {
    		if (type === 'currency') return d3.format('$.1f')(num);
    		else if (type === 'persons') return d3.format('0f')(num);
    		else return d3.format('.1f')(num);
    	}
    }
};

var defaultColor = 'rgb(28,53,99)';

var width = document.getElementById('mapContainer').offsetWidth;
var height = width / 2;

var typeById = {},
	type2ById = {},
	type3ById = {},
	type4ById = {},
	nameById = {},
	sizeById = {},
	size2ById = {},
	regionById = {},
	pop2000ById = {},
	pop2013ById = {},
	popGrowthById = {},
	jobs2000ById = {},
	jobs2013ById = {},
	jobsGrowthById = {},
	incPerCapitaById = {},
	unemById = {},
	povById = {},
	eduById = {},
	linkById = {},
	idByName = {},
	countyObjectById = {};
	
var countyName = d3.select("#countyName"),
	countyPop2013 = d3.select('#countyPop2013'),
	countyJobs2013 = d3.select('#countyJobs2013'),
	countyIncPerCap = d3.select('#countyIncPerCap'),
	countyUnem = d3.select('#countyUnem'),
	countyPov = d3.select('#countyPov'),
	countyEdu = d3.select('#countyEdu');
	
var topo,stateMesh,projection,path,svg,g;
var circles, clickedCircle;
var colorSelection = ['workforce', 'stratPlan', 'entrep', 'inter', 'infra', 'region'];
var popSelection = ['large', 'medium', 'small'];
var regionSelection = ['northeast', 'south', 'midwest', 'west'];
  
var countyStats = $("#countyStats").hide();
var countyTitle = $('#countyStats-title').hide();

var	typeClasses = d3.scale.threshold()
	.domain([1,2,3,4,5,6,7])
	.range(['noData', 'workforce', 'stratPlan', 'entrep', 'inter', 'infra', 'region']);

var regionClasses = d3.scale.threshold()
	.domain([1,2,3,4,5])
	.range(['noData', 'northeast', 'south', 'midwest', 'west']);

/*	
var	color = d3.scale.threshold()
	.domain([1,2,3,4,5,6,7])
	.range(['none', 'rgb(253,156,2)', 'rgb(0,153,209)', 'rgb(70,200,245)', 'rgb(254,207,47)', 'rgb(102,204,204)', 'rgb(69,178,157)']);
*/
var color = function(type){
	switch(type){
		case 'workforce':
			return 'rgb(253,156,2)';
			break;
		case 'stratPlan':
			return 'rgb(0,153,209)';
			break;
		case 'entrep':
			return 'rgb(70,200,245)';
			break;
		case 'inter':
			return 'rgb(254,207,47)';
			break;
		case 'infra':
			return 'rgb(102,204,204)';
			break;
		case 'region':
			return 'rgb(69,178,157)';
			break;
		default:
			return 'none';
			break;
		
	}
};

function sizeClasses(d){
	switch(d){
		case 3:
			return "large";
			break;
		case 2:
			return "medium";
			break;
		case 1:
			return "small";
			break;
		default:
			return "none";
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

  g = svg.append("g");
  
  colorFilterBehavior();
  sizeFilterBehavior();
  regionFilterBehavior();
  setDefinitionBehavior();
  //setSearchBehavior();
}

d3.csv("data/EDMapData.csv", function (error, countyData) {
	data = countyData;
	
	countyData.forEach(function(d) { 
	  	typeById[d.id] = +d.TypeNum;
	  	type2ById[d.id] = +d.TypeNum2;
	  	type3ById[d.id] = +d.TypeNum3; 
	  	type4ById[d.id] = +d.TypeNum4; 
	  	nameById[d.id] = d.CountyState;
	  	sizeById[d.id] = +d.CountySize;
	  	size2ById[d.id] = +d.CountySize2;
	  	regionById[d.id] = +d.region;
	  	pop2000ById[d.id] = +d.pop2000;
		pop2013ById[d.id] = +d.pop2013;
		popGrowthById[d.id] = +d.popGrowth;
		jobs2000ById[d.id] = +d.jobs2000;
		jobs2013ById[d.id] = +d.jobs2013;
		jobsGrowthById[d.id] = +d.jobsGrowth;
		incPerCapitaById[d.id] = +d.incPerCap;
		unemById[d.id] = +d.unem;
		povById[d.id] = +d.pov;
		eduById[d.id] = +d.edu;
		linkById[d.id] = d.link;
	});
	
	
});
	
d3.json("us.json", function(error, us) {

  var counties = topojson.feature(us, us.objects.counties).features;
  stateMesh = topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; });
  
  topo = counties;
  draw(topo, stateMesh);
  buildCountyList();

});

function draw(topo, stateMesh) {

  var county = g.selectAll(".county").data(topo);
  
  county.enter().insert("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("class", "county");

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
   			it.properties.r = 5 + (width*.01);
   			it.properties.c = path.centroid(it);
   			it.properties.x = width/2;
   			it.properties.y = height/2;
   		})
   		.attr("id", function(it){return it.id;})
   		.attr("cx", function(it) { return it.properties.x + it.properties.c[0] ;})
   		.attr("cy", function(it) { return it.properties.y + it.properties.c[1] ;})
   		.attr("r", function(it) { if(!isNaN(typeById[it.id])){return it.properties.r;} else{return 0;} })
   		.style("fill", function(it) {if(!isNaN(typeById[it.id])){return defaultColor;}else{return 'none';}})
   		.attr("class", function(it){if(!isNaN(typeById[it.id])){return "circle " + "hasData "+ sizeClasses(sizeById[it.id]) + " " + typeClasses(typeById[it.id])  + " active";}else{return "circle";}})
   		.append("svg:title").text(function(d){return nameById[d.id];});
   
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
var prevSelected;
function addRemoveCircles(selected, add, cSelection, pSelection, rSelection, which){
	var counter = 0, selection;
	
	switch(which){
		case 'color':
			prevSelected = selected;
			selection = cSelection;
			break;
		case 'pop':
			selection = pSelection;
			break;
		case 'region':
			selection = rSelection;
			break;
	}
	
	if(add){
		selection.push(selected);
	}
	else{
		if(which==='color' && selection.length===6 || which==='pop' & selection.length===3 || which==='region' & selection.length===4){}
		else{
			selection.splice(selection.indexOf(selected), 1);
		}
	}
	
	circles.style('fill', 'none');
	
	circles.style("fill", function(d){ 
		var colorMatch = false, popMatch = false, regionMatch=false, c = 0, p = 0, r=0;
		while(r<rSelection.length){
			if(regionClasses(regionById[d.id])===rSelection[r]){
				regionMatch = true;
				break;
			}
			r++;
		}
		while(p<pSelection.length){
			if(sizeClasses(sizeById[d.id])===pSelection[p] || sizeClasses(size2ById[d.id])===pSelection[p]){
				popMatch = true;
				break;
			}
			p++;
		}
		while(c<cSelection.length){
			if(typeClasses(typeById[d.id])===cSelection[c] || typeClasses(type2ById[d.id])===cSelection[c] || typeClasses(type3ById[d.id])===cSelection[c] || typeClasses(type4ById[d.id])===cSelection[c]){
				colorMatch = true;
				break;
			}
			c++;
		}
		if(popMatch && colorMatch && regionMatch){
			counter++;
			if(which==='color'){
				if(colorSelection.length===6) return defaultColor;
				else return color(selected);
			}
			else {
				if(colorSelection.length===6) return defaultColor;
				else return color(prevSelected);
			}
		}
		else{
			return 'none';
		}
	});	
	console.log(counter);
	if(counter===35){
		circles.style('fill', defaultColor);
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
			typeButtons.classed("active", false);
			chosen.classed("active", true);
			colorSelection = [];
		}
		else{
			switch(colorSelection.length){
				case 6:
					add = true;
					typeButtons.classed("active", false);
					chosen.classed("active", true);
					colorSelection = [];
					break;
				default:
					add = false;
					typeButtons.classed("active", true);
					colorSelection = selectAll;
					break;
			}
		}
		addRemoveCircles(chosen.attr('id'), add, colorSelection, popSelection, regionSelection, 'color');
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
			popButtons.classed("active", false);
			chosen.classed("active", true);
			popSelection = [];
		}
		else{
			switch(popSelection.length){
				case 3:
					add = true;
					popButtons.classed("active", false);
					chosen.classed("active", true);
					popSelection = [];
					break;
				default:
					add = false;
					popButtons.classed("active", true);
					popSelection = selectAll;
					break;
			}
		}
		addRemoveCircles(chosen.attr('id'), add, colorSelection, popSelection, regionSelection, 'pop');
	});
}
function regionFilterBehavior(){
	var regionButtons = d3.select("#regionFilters").selectAll(".btn");
	var selectAll = ['northeast', 'south', 'midwest', 'west'];
	var add;
	
	regionButtons.on("click", function(){
		var chosen = d3.select(this);
		
		if(!chosen.classed("active")){
			add = true;
			regionButtons.classed("active", false);
			chosen.classed("active", true);
			regionSelection = [];
		}
		else{
			switch(regionSelection.length){
				case 4:
					add = true;
					regionButtons.classed("active", false);
					chosen.classed("active", true);
					regionSelection = [];
					break;
				default:
					add = false;
					regionButtons.classed("active", true);
					regionSelection = selectAll;
					break;
			}
		}
		addRemoveCircles(chosen.attr('id'), add, colorSelection, popSelection, regionSelection, 'region');
	});
}
function resetFilters(){
	var typeButtons = d3.select("#typeFilters").selectAll(".btn");
	var popButtons = d3.select("#popFilters").selectAll(".btn");
	var regionButtons = d3.select("#regionFilters").selectAll(".btn");
	popSelection = ['large', 'medium', 'small'];
	colorSelection = ['workforce', 'stratPlan', 'entrep', 'inter', 'infra', 'region'];
	regionSelection = ['northeast', 'south', 'midwest', 'west'];
	
	popButtons.classed("active", true);
	typeButtons.classed("active", true);
	regionButtons.classed("active", true);
	
	
	addRemoveCircles(null, false, colorSelection, popSelection, regionSelection, 'color');
}
function populateStats(d){
	
	countyName.html(nameById[d.id]);
	countyPop2013.html(format['level'](pop2013ById[d.id], 'pop'));
	countyJobs2013.html(format['level'](jobs2013ById[d.id], 'jobs'));
	countyIncPerCap.html(format['level'](incPerCapitaById[d.id], 'currency'));
	countyUnem.html(format['percent'](unemById[d.id]));
	countyPov.html(format['percent'](povById[d.id]));
	countyEdu.html(format['percent'](eduById[d.id]));
	
}
//doesn't work
function buildCountyList(){
	
		
	var table = d3.select('#countyList').append('table').attr('class', 'table').attr('id', 'listTable').append('tbody');
	
	var namesPerRow = 5;
	var i = 0;
	circles[0].sort(function(a,b){return a.id-b.id;});
	while(i<circles[0].length){
		var row = table.append('tr');
		for(j=0; j<namesPerRow; j++){
			var name = nameById[circles[0][i+j].id];
			var link = 'profiles/' + linkById[circles[0][i+j].id];
			row.append('td').append('a').attr('href', link).text(name);
		}
		i+=namesPerRow;
	}
}

function executeSearchMatch(FIPS) {
	$('#search_field').val('');
	
	var county = countyObjectById[parseInt(FIPS)];
    if (county) {
		highlight(county);
		populateStats(county);
		
	} else {
		tooltip.classed('hidden', true);
		//noty({text: 'No information availble for this county'});
		return false;
	}    
};
function highlight(d) {
	
	console.log(d);
	countyStats.show();
	countyTitle.show();
	
	circles.classed("active", false);
	
	if (d && clickedCircle !== d) {
		clickedCircle = d;
	  } else {
	    clickedCircle = null;
	  }
	
	circles
      .classed("active", clickedCircle && function(d) { return d === clickedCircle; });
    if(clickedCircle === null){
    	circles.classed("active", true); 
    	countyStats.hide();
    	countyTitle.hide();
    }
    
}

function doubleClicked(link){
	open('profiles/' + link, '_blank');
}

function redraw() {
  width = document.getElementById('mapContainer').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo, stateMesh);
}

var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}