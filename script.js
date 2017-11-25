//set margins
var margin = {top: 100, right: 100, bottom: 100, left: 100};
var width = 900 - margin.left - margin.top;
var height = 700 - margin.top - margin.bottom;
var totalWidth = 900;
var totalHeight = 700;

//boxplot colors
var colors = {0: ['#a85c0f','#cc9060','#eac6ad'], //orange
              1: ['#2c4443','#6d7e7d','#b4bdbc'], //teal
              2: ['#5e5c30','#928e6f','#c8c6b5'], //green
              3: ['#a0892b','#c3ae72','#e3d6b6'], //yellow
              4: ['#27333d','#687078','#b1b5ba'], //blue
              5: ['#5b5b5b','#8f8f8f','#c6c6c6'], //grey
              6: ['#894229','#b57e6a','#dcbdb2']  //red
              }

//set up svgs and charts
var svg = d3.select("#chart")
            .append('svg')
            .attr("width", totalWidth)
            .attr("height", totalHeight)
            .attr("transform", "translate(" + 4*margin.left + "," + margin.top + ")");

var chart = svg.append('g')
                .attr("transform", "translate(" + margin.left/2 + "," + margin.left/1.5 + ")");

var svgSmall = d3.select('#small-chart')
                    .append('svg')
                    .attr('width', totalWidth/2.25)
                    .attr('height', totalHeight/2.8)

var smallChart = svgSmall.append('g')



//load data
d3.json("ht_sentencing.json", function(error, data) {
  if (error) throw error;

  dataset = data;

  dataset.forEach(function (d) {
    d.sentence = +d.sentence;
    d.foreign_vics = +d.foreign_vics;
    d.recruit = +d.recruit;
    d.region = +d.region;
    d.def_race = +d.def_race;
    d.def_gender = +d.def_gender;
    d.judge_race = +d.judge_race;
    d.judge_gender = +d.judge_gender;
    d.appointed_by = +d.appointed_by;
    d.type = +d.type;
    d.year_group = +d.year_group;
    d.vic_gender = +d.vic_gender;
  });

  drawSideChart();
  drawChart();

}); //end load data




function getData() {
  //subset data based on selected variable and get 5-number summary

  selectedVariable = d3.select('input[name="variable"]:checked').property("value");
  console.log(selectedVariable)

  var filteredData = dataset.filter(function(d) { return !isNaN(d[selectedVariable]) });
  var nestedData = d3.nest()
      .key(function(d) {return d[selectedVariable];})
      .rollup(function(v) {return {
                min: d3.min(v, function(d) {return d.sentence}),
                q1: d3.quantile(v.map(function(d) { return d.sentence;}).sort(d3.ascending), 0.25),
                median: d3.median(v, function(d) {return d.sentence;}),
                q3: d3.quantile(v.map(function(d) { return d.sentence;}).sort(d3.ascending), 0.75),
                max: d3.max(v, function(d) {return d.sentence;})
                };
              })
      .entries(filteredData);

  return nestedData;

} //end getData





function getScales(finalData) {

  var xScale = d3.scaleBand()
                  .domain(finalData.map(function(d) {return d.key;}))
                  .range([0,height])

  var yScale = d3.scaleLinear()
                  .domain([d3.max(finalData, function(d) {return d.value.max;}), 0])
                  .range([width, 0]);

  return [xScale, yScale]

} //end getScales





function drawSideChart() {

  var xPoints = {75: 'minimum', 125: '25%', 200: 'median',
                275: '75%', 325: 'maximum'};

  //append min and max bars
  smallChart.append('rect')
            .attr('class', 'chart-desc')
            .attr('y', 45)
            .attr('x', 75)
            .attr('width', 250)
            .attr('height', 12)
            .style('fill', '#d6d6d6');

  //append iqr bars
  smallChart.append('rect')
            .attr('class', 'chart-desc')
            .attr('y', 45)
            .attr('x', 125)
            .attr('width', 150)
            .attr('height', 12)
            .style('fill', '#afafaf');

  //append median
  smallChart.append('circle')
            .attr('class', 'chart-desc')
            .attr('cx', 200)
            .attr('cy', 50)
            .attr('r', 15)
            .style('fill', '#898989');

  for (var x in xPoints) {
    //append text
    smallChart.append('text')
              .attr('class', 'chart-desc-text')
              .attr('transform', 'rotate(25' + ',' + x + ',' + 85 + ')')
              .attr('x', x)
              .attr('y', 85)
              .text(xPoints[x])

    //append lines
    smallChart.append('line')
              .attr('class', 'chart-desc')
              .attr('x1', x)
              .attr('y1', 65)
              .attr('x2', x)
              .attr('y2', 75)
              .attr('stroke-width', 1)
              .attr('stroke', 'black')

  } //end loop

}; // end makeSideChart





function drawChart() {

  finalData = getData();

  scales = getScales(finalData);

  xScale = scales[0]
  yScale = scales[1]

  drawGrid(yScale, chart);


  //create boxplot groups
  boxplotGroups = chart.selectAll("rect")
                        .data(finalData)
                        .enter()
                        .append('g')
                        .attr('id', function(d) {return 'plot' + d.key})
                        .attr('class', 'plot')

  //append min lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return d.value.q1})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr('height', 12)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(2000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(d.value.min);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr("width", function(d) {return yScale(d.value.q1 - d.value.min);})
                .attr("height", 12)
                .attr("fill", function(d) {return colors[d.key][2]});

  //append max lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return d.value.q3})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr('height', 12)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(2000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(d.value.q3);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr("width", function(d) {return yScale(d.value.max - d.value.q3);})
                .attr("height", 12)
                .attr("fill", function(d) {return colors[d.key][2]});

  //append q1 lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return d.value.median})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr('height', 12)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(d.value.q1);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr("width", function(d) {return yScale(d.value.median - d.value.q1);})
                .attr("height", 12)
                .attr("fill", function(d) {return colors[d.key][1]});

  //append q3 lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return d.value.median})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr('height', 12)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(d.value.median);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr("width", function(d) {return yScale(d.value.q3 - d.value.median);})
                .attr("height", 12)
                .attr("fill", function(d) {return colors[d.key][1]});

  //append circles
  boxplotGroups.append('circle') //why does this work when i initially selected rect?
                .attr('cy', function(d) {return xScale(d.key) + xScale.bandwidth()/2;})
                .attr('cx', -10)
                .attr('r', 15)
                .transition()
                .duration(1000)
                .attr('clip-path', 'url(#chart-area)')
                .attr('class', 'boxplot')
                .attr("cy", function(d) {return xScale(d.key) + xScale.bandwidth()/2;})
                .attr("cx", function(d) {return yScale(d.value.median);})
                .attr("r", 15)
                .attr('stroke-width', 1.5)
                .attr('stroke', 'white')
                .attr("fill", function(d) {return colors[d.key][0]});


  //clip path for medians
  chart.append('clipPath')
        .attr('id', 'chart-area')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)


  appendLabels(xScale, yScale);


  //tooltip on
  boxplotGroups.on('mouseover', function(d) {

    plot = d3.select(this);

    xValues = plot._groups[0][0].__data__.value
    y = parseFloat(plot._groups[0][0].lastChild.attributes[0].value)

    for (var v in xValues) {
      label = String(xValues[v])

      chart.append('text')
            .attr('x', yScale(xValues[v]))
            .attr('y', y + 30)
            .attr('class', 'tooltip')
            .attr('text-anchor', 'middle')
            .text(label.slice(0,4));
    }
    });

  //tooltip off
  boxplotGroups.on('mouseout', function() {
    d3.selectAll('.tooltip').remove();
   })

}; //end drawChart





function appendLabels(xScale, yScale) {

  //categories
  var races = {0: 'White', 1: 'Black', 2: 'Hispanic', 3: 'Asian', 4: 'Indian', 5: 'Other'}
  var genders = {0: 'Male', 1: 'Female'}
  var parties = {0: 'Democrat', 1: 'Republican'}
  var methods = {0: 'Unknown/other', 1: 'Online', 2: 'Kidnap', 3: 'Face-to-Face',
                4: 'Telephone', 5: 'Family', 6: 'Newspaper'}
  var types = {1: 'Labor trafficking', 2: 'Adult sex trafficking', 3: 'Minor Sex Trafficking'}
  var years = {1: '2000-2003', 2: '2004-2007', 3: '2008-2011', 4: '2012-2015'}

  //append labels
  chart.selectAll('.rect')
        .data(finalData)
        .enter()
        .append('rect')
        .attr('x', function(d) {return yScale(d.value.max + 5);})
        .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 10;})
        .attr('width', 0)
        .attr('height', 18)
        .style('fill', '#f4f4f4')
        .transition()
        .duration(1000)
        .delay(2500)
        .attr('class', 'labels')
        .attr('x', function(d) {return yScale(d.value.max) + 5;})
        .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 10;})
        .attr('width', 50)
        .attr('height', 18)
        .style('fill', '#f4f4f4')

  chart.selectAll(".text")
        .data(finalData)
        .enter()
        .append("text")
        .attr('x', function(d) {return yScale(d.value.max) + 8;})
        .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 + 1;})
        .attr('fill', '#f4f4f4')
        .transition()
        .duration(1500)
        .delay(2500)
        .attr('class', 'labels')
        .attr('x', function(d) {return yScale(d.value.max) + 8;})
        .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 + 1;})
        .attr('text-anchor', 'left')
        .attr('alignment-baseline', 'middle')
        .attr('fill', 'black')
        .text(function(d) {
          if (selectedVariable == 'judge_race' || selectedVariable == 'def_race') {
            return races[d.key]
          }

          else if (selectedVariable == 'judge_gender' || selectedVariable == 'def_gender' || selectedVariable == 'vic_gender') {
            return genders[d.key]
          }

          else if (selectedVariable == 'appointed_by') {
            return parties[d.key]
          }

          else if (selectedVariable == 'recruit') {
            return methods[d.keys]
          }

          else if (selectedVariable == 'type') {
            return types[d.keys]
          }

          else if (selectedVariable == 'year_group') {
            return years[d.keys]
          }

        }) //end text

}; //end appendLabels




function drawGrid(yScale, chart) {

  //draw y axis
  var grid = chart.append('g')
                  .attr('id', 'grid')

  grid.append('g')
      .call(d3.axisTop(yScale)
              .tickSizeInner(0)
              .tickSizeOuter(0)
              .tickPadding(10))
      .attr('id', 'grid-text')


  //create gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
  function make_x_gridlines() {
    return d3.axisBottom(yScale)
  }

  //draw gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
  grid.append("g")
        .attr("class", "lines")
        .attr("transform", "translate(0," + height + ")")
        .call(make_x_gridlines()
            .tickSize(-height)
            .tickFormat("")
        )

  //remove horizonal lines from y axis https://bl.ocks.org/mbostock/3371592
  function customYAxis(g) {
    grid.call(yScale);
    grid.select(".domain").remove(); }

  //run this twice because there are two horizonal lines to remove
  for (i=0; i<2; i++) {
    grid.append("g")
         .call(customYAxis);
  }

  //y axis labels
  grid.append("text")
    .attr("class", "axisLabel")
    .attr("y", -35)
    .attr("x", yScale(20))
    .attr('text-anchor', 'middle')
    .text("Number of Cases");

}; //end drawGrid




function sortPlots(xScale, selectedVariable) {

  chart.selectAll('.plot')
        .sort(function(a, b) {
            if (selectedVariable == 'ascending') {
              return d3.ascending(a.value.median, b.value.median)
            }
            else if (selectedVariable == 'descending') {
              return d3.descending(a.value.median, b.value.median)
            }
        })
        .transition()
        .duration(1000)
        .attr('x', function(d) {
          return xScale(d.key)
        })

} //end sortPlots


var sortMenu = d3.select('#sort-menu')

sortMenu.on('change', function() {
  var selectedVariable = d3.select('input[name="sort-by"]:checked')
                            .property("value");
  console.log(selectedVariable)
  finalData = getData();
  scales = getScales(finalData);
  xScale = scales[0];
  sortPlots(xScale, selectedVariable);
})


//update
var variableMenu = d3.select("#include-menu")
console.log(variableMenu)

variableMenu.on('change', function() {
  var selectedVariable = d3.select('input[name = "variable"]:checked')
                            .property("value");

  var boxplots = d3.selectAll('.plot')
  var grid = d3.select('#grid')
  var labs = d3.selectAll('.labels')
  var clippaths = d3.select('#chart-area')

  //uncheck sort options
  d3.selectAll('input[name = "sort-by"]').property('checked', false);

  boxplots.remove();
  grid.remove();
  labs.remove();
  clippaths.remove();

  drawChart();

})
