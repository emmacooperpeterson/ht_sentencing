//set margins
var margin = {top: 100, right: 100, bottom: 100, left: 100};
var totalWidth = 800;
var totalHeight = 650;
var width = totalWidth - margin.left - margin.top;
var height = totalHeight - margin.top - margin.bottom;

var smallWidth = 3.5*margin.left;
var smallHeight = 1.75*margin.top;

//boxplot colors and labels
var colors = {0: ['#a85c0f','#cc9060','#eac6ad'], //orange
              1: ['#2c4443','#6d7e7d','#b4bdbc'], //teal
              2: ['#5e5c30','#928e6f','#c8c6b5'], //green
              3: ['#a0892b','#c3ae72','#e3d6b6'], //yellow
              4: ['#27333d','#687078','#b1b5ba'], //blue
              5: ['#5b5b5b','#8f8f8f','#c6c6c6'], //grey
              6: ['#894229','#b57e6a','#dcbdb2']}  //red

var tooltipColors =  {0: '#efddd1', //orange
                      1: '#d4d9d8', //teal
                      2: '#deddd5', //green
                      3: '#ece5d5', //yellow
                      4: '#d3d5d7', //blue
                      5: '#dddddd', //grey
                      6: '#e8d9d3'}  //red

var xLabels = {'judge_race': 'Judge Race', 'judge_gender': 'Judge Gender',
                'appointed_by': 'Judge Party Affiliation',
                'def_race': 'Defendant Race', 'def_gender': 'Defendant Gender',
                'vic_gender': 'Victim Gender', 'recruit': 'Method of Recruitment',
                'type': 'Type of Trafficking', 'region': 'U.S. Region',
                'year_group': 'Year'}

//set up svgs and charts
var svg = d3.select("#chart")
            .append('svg')
            .attr("width", totalWidth + margin.top/2)
            .attr("height", totalHeight - margin.top/2)
            .attr("transform", "translate(" + 3.5*margin.left + "," + margin.top/2 + ")");

var chart = svg.append('g')
                .attr("transform", "translate(" + margin.left/2 + "," + margin.top/2 + ")");

var svgSmall = d3.select('#small-chart')
                    .append('svg')
                    .attr('width', smallWidth)
                    .attr('height', smallHeight)

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

  //draw initial chart
  explodeOption();
  drawSideChart();
  drawChart();
  drawGrid();
  xLabel();
  applyFootnotes();
  window.setTimeout('delayScatters(dataset)', 1);
}); //end load data




function getData(sorted='ascending') {

  selectedVariable = d3.select('input[name="variable"]:checked').property("value");

  var filteredData = dataset.filter(function(d) {return !isNaN(d[selectedVariable]);});
  var nestedData = d3.nest()
      .key(function(d) {return d[selectedVariable];})
      .rollup(function(v) {return {
                min: d3.min(v, function(d) {return d.sentence}),
                q1: d3.quantile(v.map(function(d) {return d.sentence;}).sort(d3.ascending), 0.25),
                median: d3.median(v, function(d) {return d.sentence;}),
                q3: d3.quantile(v.map(function(d) {return d.sentence;}).sort(d3.ascending), 0.75),
                max: d3.max(v, function(d) {return d.sentence;}),
                count: v.length
                };
              })
      .entries(filteredData);

  if (sorted == 'ascending') {
    nestedData.sort(function(a, b) {
            if (a.value.median == b.value.median) {
              return d3.ascending(a.value.q3, b.value.q3)
            }

            else {return d3.ascending(a.value.median, b.value.median)}
            }
    ); //end sort
  } //end if

  else if (sorted == 'descending') {
    nestedData.sort(function(a, b) {
            if (a.value.median == b.value.median) {
              return d3.descending(a.value.q3, b.value.q3)
            }

            else {return d3.descending(a.value.median, b.value.median)}
            }
    ); //end sort
  } //end else if

  return nestedData;
} //end getData




function getScales(finalData) {

  var xScale = d3.scaleBand()
                  .domain(finalData.map(function(d) {return d.key;}))
                  .range([0,.9*height]);

  var yScale = d3.scaleLinear()
                  .domain([30, 0])
                  .range([width, 0]);

  return {'x': xScale, 'y': yScale}
} //end getScales



//append explode button
function explodeOption() {

  smallChart.append('text')
            .attr('x', margin.left/2)
            .attr('y', margin.top/4.5)
            .attr('class', 'side-header')
            .text('Explode plots:')

  smallChart.append('rect')
            .attr('x', margin.left*1.6)
            .attr('y', margin.top/12.5)
            .attr('height', 20)
            .attr('width', 36)
            .attr('rx', 12)
            .attr('ry', 12)
            .attr('id', 'oval')
            .attr('fill', '#898989')
            .on('mouseover', function(d) {
              d3.select(this).style('cursor', 'pointer')},

              'mouseout', function(d) {
                d3.select(this).style('cursor', 'default')
              })

  smallChart.append('circle')
            .attr('cx', margin.left*1.7)
            .attr('cy', margin.top/5.6)
            .attr('r', 8)
            .attr('id', 'explode-button')
            .attr('fill', 'white')
            .on('mouseover', function(d) {
              d3.select(this).style('cursor', 'pointer')},

              'mouseout', function(d) {
                d3.select(this).style('cursor', 'default')
              })

  //mouseover effect:
  //https://stackoverflow.com/questions/36326683/d3-js-how-can-i-set-the-cursor-to-hand-when-mouseover-these-elements-on-svg-co

} //end explodeOption




function drawSideChart(view='box') {

  var xPoints = {'min': [smallWidth/6, 'minimum'], 'q1': [smallWidth/3, '25th percentile'],
                'med': [smallWidth/2, 'median'], 'q3': [smallWidth/1.5, '75th percentile'],
                'max': [smallWidth/1.2, 'maximum']
                };

  if (view == 'box') {

    for (var x in xPoints) {
      //append text
      smallChart.append('text')
                .attr('class', 'desc box-desc box-desc-text')
                .attr('transform', 'rotate(25' + ',' + xPoints[x][0] + ',' + (margin.top*1.1) + ')')
                .attr('x', xPoints[x][0])
                .attr('y', margin.top*1.1)
                .text(xPoints[x][1])
                .attr('opacity', 1)

      //append lines
      smallChart.append('line')
                .attr('class', 'desc box-desc')
                .attr('x1', xPoints[x][0])
                .attr('y1', margin.top/1.1)
                .attr('x2', xPoints[x][0])
                .attr('y2', margin.top)
                .attr('stroke-width', 0.5)
                .attr('stroke', 'black')
                .attr('opacity', 1)
    } //end loop

    //append min and max bars
    smallChart.append('rect')
              .attr('class', 'desc box-desc')
              .attr('y', margin.top/1.3)
              .attr('x', xPoints.min[0])
              .attr('width', xPoints.max[0] - xPoints.min[0])
              .attr('height', 9)
              .style('fill', '#d6d6d6')
              .attr('opacity', 1);

    //append iqr bars
    smallChart.append('rect')
              .attr('class', 'desc box-desc')
              .attr('y', margin.top/1.3)
              .attr('x', xPoints.q1[0])
              .attr('width', xPoints.q3[0] - xPoints.q1[0])
              .attr('height', 9)
              .style('fill', '#afafaf')
              .attr('opacity', 1);

    //append median
    smallChart.append('circle')
              .attr('class', 'desc box-desc')
              .attr('cx', xPoints.med[0])
              .attr('cy', margin.top / (margin.top / (margin.top / 1.3 + 4.5)))
              .attr('r', 12)
              .style('fill', '#898989')
              .attr('opacity', 1);
  }

  else if (view == 'dots') {

    var dots = [margin.left/2, margin.left/1.8, margin.left/1.6, margin.left/1.5,
                margin.left/1.3, margin.left, margin.left*1.1, margin.left*1.2,
                margin.left*1.4, margin.left*1.9, margin.left*2, margin.left*2.4,
                margin.left*2.6, margin.left*2.6, margin.left*2.7, margin.left*2.8,
                margin.left*2.9]

    var description = ['Each dot represents one defendant. Its horizonal position',
                        'represents the prison sentence the defendent received.']

    smallChart.selectAll('circle')
              .data(dots)
              .enter()
              .append('circle')
              .attr('class', 'desc dot-desc')
              .attr('cx', function(d) {return d})
              .attr('cy', function(d, i) {
                if (i%4 == 0) {return margin.top}
                else if (i%3 == 0) {return margin.top*1.1}
                else if (i%2 == 0) {return margin.top*0.9}
                else {return margin.top*0.8}})
              .attr('r', 3)
              .attr('opacity', 0.6)

    smallChart.selectAll('text.desc')
              .data(description)
              .enter()
              .append('text')
              .attr('x', margin.left/2)
              .attr('y', function(d,i) {
                 if (i === 0) {return margin.top*1.4}
                 else {return margin.top*1.5}})
              .attr('class', 'desc dot-desc dot-desc-text')
              .text(function(d) {return d})
              .attr('opacity', 1)
    }
}; // end makeSideChart




function drawChart() {

  var sortMethod = d3.select('input[name="sort-by"]:checked')
                            .property("value");

  finalData = getData(sortMethod);
  scales = getScales(finalData);
  xScale = scales.x
  yScale = scales.y

  //create gradient to fade max lines https://www.freshconsulting.com/d3-js-gradients-the-easy-way/
  var defs = chart.append("defs");

  var gradient = defs.append("linearGradient")
     .attr("id", "svgGradient")
     .attr("x1", "0%")
     .attr("x2", "100%")
     .attr("y1", "0%")
     .attr("y2", "0%");

  gradient.append("stop")
     .attr('class', 'start')
     .attr("offset", "0%")
     .attr("stop-color", "#f4f4f4")
     .attr("stop-opacity", 0);

  gradient.append("stop")
     .attr('class', 'end')
     .attr("offset", "100%")
     .attr("stop-color", "#f4f4f4")
     .attr("stop-opacity", 1);

  //add variable labels
  appendLabels(xScale, yScale);

  //create boxplot groups
  boxplotGroups = chart.selectAll("rect")
                        .data(finalData)
                        .enter()
                        .append('g')
                        .attr('id', function(d) {return 'plot' + d.key})
                        .attr('class', 'plot')
                        .attr('opacity', 1)

  //append min lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(d.value.q1)})
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
                .attr("fill", function(d) {return colors[d.key][2]})
                .attr('opacity', 1);

  //append max lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(d.value.q3)})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr('height', 12)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(2000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(d.value.q3);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr("width", function(d) {
                  if (d.value.max > 30) {return yScale(30-d.value.q3)}
                  else {return yScale(d.value.max - d.value.q3);}
                })
                .attr("height", 12)
                .attr("fill", function(d) {return colors[d.key][2]})
                .attr('opacity', 1);

  //append gradient lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(25)})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr('height', 12)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(2000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(25);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
                .attr("width", function(d) {
                  if (d.value.max > 30) {return yScale(5)}
                  else {return 0}
                })
                .attr("height", 12)
                .attr('fill', 'url(#svgGradient)')
                .attr('opacity', 1);

  //append q1 lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(d.value.median)})
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
                .attr("fill", function(d) {return colors[d.key][1]})
                .attr('opacity', 1);

  //append q3 lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(d.value.median)})
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
                .attr("fill", function(d) {return colors[d.key][1]})
                .attr('opacity', 1);

  //append circles
  boxplotGroups.append('circle')
                .attr('cy', function(d) {return xScale(d.key) + xScale.bandwidth()/2;})
                .attr('cx', -20)
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
                .attr("fill", function(d) {return colors[d.key][0]})
                .attr('opacity', 1);

  //clip path for medians
  chart.append('clipPath')
        .attr('id', 'chart-area')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)

  //tooltip on
  boxplotGroups.on('mouseover', function(d) {

    var plot = d3.select(this);
    var xValues = plot._groups[0][0].__data__.value;
    var y = parseFloat(plot._groups[0][0].childNodes[0].attributes[1].value);
    var color = plot._groups[0][0].__data__.key;
    var coordinates = d3.mouse(this);
    var xCoord = coordinates[0];

    var stats = {'min': 'min: ', 'q1': '25%: ', 'median': 'median: ',
                  'q3': '75%: ', 'max': 'max: ', 'count': 'cases: '}

    //comparison line
    chart.append('line')
          .attr('class', 'tooltip')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', 0)
          .attr('y2', height/1.1)
          .attr('stroke-width', 3)
          .attr('stroke', 'black')
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.25)
          .transition()
          .duration(500)
          .attr('x1', yScale(xValues.median))
          .attr('y1', 0)
          .attr('x2', yScale(xValues.median))
          .attr('y2', height/1.1)
          .attr('stroke-width', 3)
          .attr('stroke', 'black')
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.25)

    //box to hold stats
    chart.append('rect')
          .attr('class', 'tooltip')
          .attr('x', xCoord)
          .attr('y', y + 15)
          .attr('width', 100)
          .attr('height', 102)
          .attr('fill', '#f4f4f4')
          .attr('opacity', 0)
          .transition()
          .duration(1000)
          .attr('x', xCoord)
          .attr('y', y + 15)
          .attr('width', 100)
          .attr('height', 102)
          .attr('fill', function() {return tooltipColors[color]})
          .attr('opacity', 1)

    i=32
    for (var v in xValues) {
      label = String(xValues[v])

      chart.append('text')
            .attr('x', xCoord + 10)
            .attr('y', y + i)
            .attr('opacity', 0)
            .transition()
            .duration(500)
            .attr('x', xCoord + 10)
            .attr('y', y + i)
            .attr('opacity', 1)
            .attr('class', 'tooltip')
            .text(stats[v] + label.slice(0,4));

      i = i + 15
    } //end loop
  }); //end tooltip on

  //tooltip off
  boxplotGroups.on('mouseout', function() {
    d3.selectAll('.tooltip')
      .transition()
      .duration(500)
      .attr('opacity', 0)
      .remove();
   })
}; //end drawChart




function appendLabels(xScale, yScale) {

  var races = {0: 'White', 1: 'Black', 2: 'Hispanic', 3: 'Asian', 4: 'Indian', 5: 'Other'}
  var genders = {0: 'Male', 1: 'Female'}
  var parties = {0: 'Democrat', 1: 'Republican'}
  var methods = {0: 'Unknown/other', 1: 'Online', 2: 'Kidnap', 3: 'Face-to-Face',
                4: 'Telephone', 5: 'Family', 6: 'Newspaper'}
  var types = {0: 'Labor trafficking', 1: 'Adult sex trafficking', 2: 'Minor sex trafficking'}
  var regions = {0: 'South', 1: 'Northeast', 2: 'West', 3: 'Midwest'}
  var years = {0: '2000-2003', 1: '2004-2007', 2: '2008-2011', 3: '2012-2015'}

  var labels = {'judge_race': races, 'judge_gender': genders,
                'appointed_by': parties, 'def_race': races,
                'def_gender': genders, 'vic_gender': genders,
                'recruit': methods, 'type': types, 'region': regions,
                'year_group': years}

  var varLabels = chart.selectAll(".text")
        .data(finalData)
        .enter()
        .append("text")
        .attr('x', width*1.02)
        .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 + 1;})
        .attr('fill', '#f4f4f4')
        .transition()
        .duration(1500)
        .attr('class', 'var-labels')
        .attr('id', function(d) {return 'label' + d.key})
        .attr('x', width*1.02)
        .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 + 1;})
        .attr('text-anchor', 'left')
        .attr('alignment-baseline', 'middle')
        .attr('fill', 'black')
        .text(function(d) {return labels[selectedVariable][d.key]})

}; //end appendLabels




function xLabel() {

  chart.append("text")
    .attr('transform', 'rotate(-90' + ',' + -20 + ',' + height/2 + ')')
    .attr("y", height/2)
    .attr("x", -20)
    .style('fill', '#f4f4f4')
    .transition()
    .duration(1500)
    .attr("class", "axisLabel")
    .attr('id', 'x-label')
    .attr('transform', 'rotate(-90' + ',' + -20 + ',' + height/2 + ')')
    .attr("y", height/2)
    .attr("x", -20)
    .style('fill', 'black')
    .attr('text-anchor', 'middle')
    .text(function() {
      var variable = d3.select('input[name = "variable"]:checked')
                                .property("value");
      return xLabels[variable]
    });
}; //end xLabel




function drawGrid() {

  finalData = getData();
  scales = getScales(finalData);
  yScale = scales.y

  //draw y axis
  var grid = chart.append('g')
                  .attr('id', 'grid')

  grid.append('g')
      .call(d3.axisBottom(yScale)
              .tickSizeInner(0)
              .tickSizeOuter(0)
              .tickPadding(.92*height)
              .tickValues([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30]))
      .attr('id', 'grid-ticks')

  //create gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
  function make_x_gridlines() {return d3.axisBottom(yScale)}

  //draw gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
  grid.append("g")
        .attr("class", "lines")
        .attr("transform", "translate(0," + .9*height + ")")
        .call(make_x_gridlines()
            .tickSize(-.9*height)
            .tickFormat("")
            .tickValues([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30]))

  //remove horizonal lines from y axis https://bl.ocks.org/mbostock/3371592
  function customYAxis(g) {
    grid.call(yScale);
    grid.select(".domain").remove();
  }

  //run this twice because there are two horizonal lines to remove
  for (i=0; i<2; i++) {
    grid.append("g")
         .call(customYAxis);
  }

  //y axis label
  grid.append("text")
    .attr("class", "axisLabel")
    .attr("y", height)
    .attr("x", yScale(15))
    .attr('text-anchor', 'middle')
    .text("Length of Sentence (in years)");

  //permanent footnotes
  chart.append('text')
        .attr('class', 'permanent-footnote')
        .attr('opacity', 0)
        .on('click', function() {
          window.open('www.humantraffickingdata.org')
        })
        .on('mouseover', function(d) {
          d3.select(this)
            .style('cursor', 'pointer')
            .transition()
            .duration(500)
            .style('opacity', 0.5)
        })
        .on('mouseout', function(d) {
            d3.select(this)
              .style('cursor', 'default')
              .transition()
              .duration(500)
              .style('opacity', 1)
          })
        .transition()
        .duration(1000)
        .attr('x', 0)
        .attr('y', height + margin.top/4)
        .attr('opacity', 1)
        .text('Source: www.HumanTraffickingData.org')


  chart.append('text')
        .attr('class', 'permanent-footnote')
        .attr('opacity', 0)
        .transition()
        .duration(1000)
        .attr('x', 0)
        .attr('y', height + margin.top/2.25)
        .attr('opacity', 1)
        .text('Sentences longer than 30 years are more than 1.5' +
              ' times higher than the 75th percentile and are' +
              ' therefore considered outliers.')

  chart.append('text')
        .attr('class', 'permanent-footnote')
        .attr('opacity', 0)
        .transition()
        .duration(1000)
        .attr('x', 0)
        .attr('y', height + margin.top/1.85)
        .attr('opacity', 1)
        .text('These account for about 4% of all sentences, ' +
              'and are excluded from this graph. Hover over each plot ' +
              'to view actual maximum sentences.')

}; //end drawGrid




function applyFootnotes() {

  //variable-specific footnotes
  var selectedVariable = d3.select('input[name = "variable"]:checked')
                            .property("value");

  footnotes = {'type':  'Some cases involve multiple types of trafficking.' +
                        ' To avoid confusion, cases included here involved' +
                        ' one of these three types exclusively.',

                'vic_gender': 'Some cases involve victims of multiple genders.' +
                              ' To avoid confusion, cases included here involved' +
                              ' one of these two genders exclusively.'
              }

  if (selectedVariable == 'type' || selectedVariable == 'vic_gender') {
    chart.append('text')
          .attr('class', 'variable-footnote')
          .attr('opacity', 0)
          .transition()
          .duration(1000)
          .attr('x', 0)
          .attr('y', height + margin.top/1.35)
          .attr('opacity', 1)
          .text(footnotes[selectedVariable])
  };
}; //end applyFootnotes()




//sort boxplots
var sortMenu = d3.select('#sort-menu')
sortPlots(sortMenu)

function sortPlots(sortMenu) {
  sortMenu.on('change', function() {
  var sortMethod = d3.select('input[name="sort-by"]:checked')
                              .property("value");
  removePlots(true);
  drawChart();
  window.setTimeout('delayScatters(dataset)', 3000);
});
}




//update boxplots
var variableMenu = d3.select("#include-menu")

variableMenu.on('change', function() {
  var selectedVariable = d3.select('input[name = "variable"]:checked')
                            .property("value");

  removePlots();
  drawChart();
  xLabel();
  applyFootnotes();
  window.setTimeout('delayScatters(dataset)', 3000);
}); //end update process




function removePlots(sorting=false) {
  var boxplots = d3.selectAll('.plot')
  var hiddenBoxplots = d3.selectAll('.gone')
  var labs = d3.selectAll('.var-labels')
  var clippaths = d3.select('#chart-area')
  var xLab = d3.select('#x-label')
  var footnotes = d3.selectAll('.variable-footnote')
  var dots = d3.selectAll('.dot')

  dots.remove();
  hiddenBoxplots.remove();
  boxplots.remove();
  labs.remove();
  clippaths.remove();

  //don't remove the x label if we're just sorting
  if (!sorting) {
    xLab.remove();
    footnotes.remove();
  };
}; // end remove Plots




//inspired by: http://mcaule.github.io/d3_exploding_boxplot/
function drawScatter(dataset, variable, category, catLength) {

  chart.selectAll('dot')
        .data(dataset)
        .enter()
        .filter(function(d) {return d[variable] == category & d.sentence <= 30})
        .append('circle')
        .attr('class', function(d) {return 'dot ' + 'dot' + d[variable]})
        .attr('opacity', 0)
        .attr('cx', yScale(15))
        .attr('cy', function(d, i) { //https://bl.ocks.org/duhaime/14c30df6b82d3f8094e5a51e5fff739a
          if (i%2 === 0) {
            return xScale(d[variable]) + xScale.bandwidth()/2
          }
          else {
           return xScale(d[variable]) + xScale.bandwidth()/2
          }
        })
        .attr('clip-path', 'url(#chart-area)')
        .transition()
        .duration(function(d, i) {
          if (i%4 === 0) {return 900 + Math.random()*100}
          else if (i%4 === 1) {return 1000 + Math.random()*100}
          else if (i%4 === 2) {return 1100 + Math.random()*100}
          else {return 1300 + Math.random()*100}
        })
        .ease(d3.easeBackOut)
        .attr('cx', function(d) {return yScale(d.sentence) + Math.random()*10})
        .attr('cy', function(d, i) {
          if (i%2 === 0) {
            return xScale(d[variable]) + xScale.bandwidth()/2 + Math.random() * height/(3*catLength)
          }
          else {
           return xScale(d[variable]) + xScale.bandwidth()/2 - Math.random() * height/(3*catLength)
          }
        })
        .attr('r', 4)
        .attr('opacity', 0.5)
        .attr('fill', function(d) {return colors[d[variable]][0]});
}; //end drawScatter




//https://stackoverflow.com/questions/17117712/how-to-know-if-all-javascript-object-values-are-true
function clickedTrue(obj) {
  for (var o in obj) {
    if(obj[o]) {return true}
  }
  return false;
} //end clickedTrue




function delayScatters(dataset) {

  var categories = d3.selectAll('.var-labels');
  var catLength = categories._groups[0].length;
  var selectedVariable = d3.select('input[name = "variable"]:checked')
                            .property("value");

  //array to keep track of which plot has been clicked
  var cats = categories._groups[0]
  var clicked = {};
  for (i = 0; i < catLength; i++) {
    var varID = cats[i].id;
    var varNum = varID.substr(-1);
    clicked[varNum] = false;
  }

  //explode plots one at at time
  categories.on('click', function() {
    var plotID = this.id;
    var cat = parseFloat(plotID.substr(plotID.length - 1));
    var box = d3.select('#plot' + cat);
    var desc = d3.selectAll('.desc');

    if (!clicked[cat]) {
      drawScatter(dataset, selectedVariable, cat, catLength);
      box.transition().duration(800).attr('opacity', 0);
      clicked[cat] = true;
    }

    else if (clicked[cat]) {
      var scatters = d3.selectAll('.dot' + cat);

      scatters.attr('clip-path', 'url(#chart-area)').transition()
              .duration(function(d, i) {
                if (i%6 === 0) {return 600 + Math.random()*100}
                else if (i%5 === 0) {return 900 + Math.random()*100}
                else if (i%4 === 0) {return 1200 + Math.random()*100}
                else if (i%3 === 0) {return 1500 + Math.random()*100}
                else if (i%2 === 0) {return 1800 + Math.random()*100}
                else {return 2100 + Math.random()*100}
              })
              .attr('cx', -10)
              .attr('opacity', 0)
              .remove();
      box.transition().duration(1300).attr('opacity', 1);
      clicked[cat] = false;
    }

    //change chart diagram if necessary
    if (clickedTrue(clicked)) {
          desc.remove();
          drawSideChart(view='dots');
    }

    else {
          desc.remove();
          drawSideChart(view='box');
    }
  }) //end categories.on


  //explode all
  var explodeButton = d3.selectAll('#explode-button, #oval');
  var explodeCircle = d3.select('#explode-button');
  var explodeClicked = false;

  explodeButton.on('click', function() {
    var box = d3.selectAll('.plot');
    var desc = d3.selectAll('.desc');
    var oval = d3.select('#oval');

    if (!explodeClicked) {
      explodeCircle.transition().duration(500).attr('cx', margin.left*1.86)
      oval.transition().duration(500).attr('fill', 'black')
      for (cat in clicked) {
        if (!clicked[cat]) {
          desc.remove();
          drawSideChart(view='dots');
          box.transition().duration(800).attr('opacity', 0);
          drawScatter(dataset, selectedVariable, cat, catLength);
          clicked[cat] = true;
        } //end if
      } //end for
      explodeClicked = true;
    } //end if

    else if (explodeClicked) {
      explodeCircle.transition().duration(500).attr('cx', margin.left*1.7);
      oval.transition().duration(500).attr('fill', '#898989');
      for (cat in clicked) {
        if (clicked[cat]) {
          desc.remove();
          drawSideChart(view='box');
          box.transition().duration(1300).attr('opacity', 1);
          var scatters = d3.selectAll('.dot');
          scatters.attr('clip-path', 'url(#chart-area)')
                  .transition()
                  .duration(function(d, i) {
                      if (i%6 === 0) {return 600 + Math.random()*100}
                      else if (i%5 === 0) {return 900 + Math.random()*100}
                      else if (i%4 === 0) {return 1200 + Math.random()*100}
                      else if (i%3 === 0) {return 1500 + Math.random()*100}
                      else if (i%2 === 0) {return 1800 + Math.random()*100}
                      else {return 2100 + Math.random()*100}
                  })
                  .attr('cx', -10)
                  .attr('opacity', 0)
                  .remove();
          clicked[cat] = false;
        } //end if
      } //end for
      explodeClicked = false;
    } //end else if
  }) //end explodeButton.on
} //end delayScatters
