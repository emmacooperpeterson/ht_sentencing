//set margins
var margin = {top: 100, right: 100, bottom: 100, left: 100};
var width = 900 - margin.left - margin.top;
var height = 700 - margin.top - margin.bottom;
var totalWidth = 900;
var totalHeight = 700;

//to convert time variable
var parseDate = d3.timeParse("%Y");

//load data
d3.json("ht_sentencing.json", function(error, data) {
  if (error) throw error;

  dataset = data;

  dataset.forEach(function (d) {
    d.case_id = +d.case_id;
    d.judge_id = +d.judge_id;
    d.first_name = d.first_name;
    d.year = parseDate(d.year);
    d.sentence = +d.sentence;
    d.labor = +d.labor;
    d.adult_sex = +d.adult_sex;
    d.minor_sex = +d.minor_sex;
    d.male_vics = +d.male_vics;
    d.female_vics = +d.female_vics;
    d.foreign_vics = +d.foreign_vics;
    d.recruit = +d.recruit;
    d.region = +d.region;
    d.def_race = +d.def_race;
    d.def_gender = +d.def_gender;
    d.judge_race = +d.judge_race;
    d.judge_gender = +d.judge_gender;
    d.appointed_by = +d.appointed_by;
  });

  makeChart(); //should everything go in one function??
});

function makeChart() {
  //console.log(dataset);

  //set up svgs and charts
  var svg = d3.select("#chart")
              .append('svg')
              .attr("width", totalWidth)
              .attr("height", totalHeight)
              .attr("transform", "translate(" + 4*margin.left + "," + margin.top + ")");

  var chart = svg.append('g')
                  .attr("transform", "translate(" + margin.left/2 + "," + margin.left/1.5 + ")");

  var svg2 = d3.select('#small-chart')
                      .append('svg')
                      .attr('width', totalWidth/2.25)
                      .attr('height', totalHeight/2.8)

  var smallChart = svg2.append('g')




  //draw chart description
  var xPoints = {75: 'minimum', 125: '25%', 200: 'median',
                275: '75%', 325: 'maximum'};

  for (var x in xPoints) {
    smallChart.append('text')
              .attr('class', 'chart-desc-text')
              .attr('transform', 'rotate(25' + ',' + x + ',' + 85 + ')')
              .attr('x', x)
              .attr('y', 85)
              .text(xPoints[x])

    smallChart.append('line')
              .attr('class', 'chart-desc')
              .attr('x1', x)
              .attr('y1', 65)
              .attr('x2', x)
              .attr('y2', 75)
              .attr('stroke-width', 1)
              .attr('stroke', 'black')

  }

  smallChart.append('rect')
            .attr('class', 'chart-desc')
            .attr('y', 45)
            .attr('x', 75)
            .attr('width', 250)
            .attr('height', 12)
            .style('fill', '#d6d6d6');

  smallChart.append('rect')
            .attr('class', 'chart-desc')
            .attr('y', 45)
            .attr('x', 125)
            .attr('width', 150)
            .attr('height', 12)
            .style('fill', '#afafaf');

  smallChart.append('circle')
            .attr('class', 'chart-desc')
            .attr('cx', 200)
            .attr('cy', 50)
            .attr('r', 15)
            .style('fill', '#898989');



  //create scales (based on judge race)

  var jR = dataset.filter(function(d) { return !isNaN(d.judge_race) && d.judge_race < 4; });

  var xScale = d3.scaleBand()
                  .domain(jR.map(function(d) {return d.judge_race;}))
                  .range([0,height])

  var yScale = d3.scaleLinear()
                  .domain([d3.max(jR, function(d) {return d.sentence;}), 0])
                  .range([width, 0]);


  //draw y axis
  chart.append('g')
      .call(d3.axisTop(yScale)
              .tickSizeInner(0)
              .tickSizeOuter(0)
              .tickPadding(10))
      .attr('id', 'y-ticks')


  //create gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
  function make_x_gridlines() {
    return d3.axisBottom(yScale)
  }

  //draw gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
  chart.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(make_x_gridlines()
            .tickSize(-height)
            .tickFormat("")
        )


  //remove horizonal lines from y axis https://bl.ocks.org/mbostock/3371592
  function customYAxis(g) {
    chart.call(yScale);
    chart.select(".domain").remove(); }

  //run this twice because there are two horizonal lines to remove
  for (i=0; i<2; i++) {
    chart.append("g")
         .call(customYAxis);
  }


  //y axis labels
  chart.append("text")
    .attr("class", "axisLabel")
    .attr("y", -35)
    .attr("x", 340)
    .text("Number of Cases");


  //subset and aggregate data based on judge_race
  var judgeRace = d3.nest()
      .key(function(d) {return d.judge_race;})
      .rollup(function(v) {return {
                min: d3.min(v, function(d) {return d.sentence}),
                q1: d3.quantile(v.map(function(d) { return d.sentence;}).sort(d3.ascending), 0.25),
                median: d3.median(v, function(d) {return d.sentence;}),
                q3: d3.quantile(v.map(function(d) { return d.sentence;}).sort(d3.ascending), 0.75),
                max: d3.max(v, function(d) {return d.sentence;})
                };
              })
      .entries(jR);
      console.log(judgeRace)

  var colors = {0: ['rgba(178, 107, 24, 1)', 'rgba(178, 107, 24, 0.7)', 'rgba(178, 107, 24, 0.3)'],
                1: ['rgba(42, 69, 76, 1)', 'rgba(42, 69, 76, 0.7)', 'rgba(42, 69, 76, 0.3)'],
                2: ['rgba(94, 93, 64, 1)', 'rgba(94, 93, 64, 0.7)', 'rgba(94, 93, 64, 0.3)'],
                3: ['rgba(183, 150, 13, 1)', 'rgba(183, 150, 13, 0.7)', 'rgba(183, 150, 13, 0.3)']
                }


  //append circles
  chart.append('g')
        .attr('id', 'medians')
        .attr('clip-path', 'url(#chart-area)')

        .selectAll(".circle")
        .data(judgeRace)
        .enter()
        .append("circle")
        .attr('class', 'boxplot')
        .attr("cy", function(d) {return xScale(d.key) + xScale.bandwidth()/2;})
        .attr("cx", function(d) {return yScale(d.value.median);})
        .attr("r", 15)
        .attr("fill", function(d) {
              var c
              if (d.key == 0) {c = colors[d.key][0]}
              else if (d.key == 1) {c = colors[d.key][0]}
              else if (d.key == 2) {c = colors[d.key][0]}
              else if (d.key == 3) {c = colors[d.key][0]}
              return c
        });


  //append max lines
  chart.selectAll(".rect")
    .data(judgeRace)
    .enter()
    .append("rect")
    .attr('class', 'boxplot')
    .attr("x", function(d) {return yScale(d.value.q3);})
    .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
    .attr("width", function(d) {return yScale(d.value.max - d.value.q3);})
    .attr("height", 12)
    .attr("fill", function(d) {
          var c
          if (d.key == 0) {c = colors[d.key][2]}
          else if (d.key == 1) {c = colors[d.key][2]}
          else if (d.key == 2) {c = colors[d.key][2]}
          else if (d.key == 3) {c = colors[d.key][2]}
          return c
    });


  //append min lines
  chart.selectAll(".rect")
        .data(judgeRace)
        .enter()
        .append("rect")
        .attr('class', 'boxplot')
        .attr("x", function(d) {return yScale(d.value.min);})
        .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
        .attr("width", function(d) {return yScale(d.value.q1 - d.value.min);})
        .attr("height", 12)
        .attr("fill", function(d) {
              var c
              if (d.key == 0) {c = colors[d.key][2]}
              else if (d.key == 1) {c = colors[d.key][2]}
              else if (d.key == 2) {c = colors[d.key][2]}
              else if (d.key == 3) {c = colors[d.key][2]}
              return c
        });


  //append iqr lines
  chart.selectAll(".rect")
        .data(judgeRace)
        .enter()
        .append("rect")
        .attr('class', 'boxplot')
        .attr("x", function(d) {return yScale(d.value.q1);})
        .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 6;})
        .attr("width", function(d) {return yScale(d.value.q3 - d.value.q1);})
        .attr("height", 12)
        .attr("fill", function(d) {
              var c
              if (d.key == 0) {c = colors[d.key][1]}
              else if (d.key == 1) {c = colors[d.key][1]}
              else if (d.key == 2) {c = colors[d.key][1]}
              else if (d.key == 3) {c = colors[d.key][1]}
              return c
        });


  //clip path for medians
  chart.append('clipPath')
        .attr('id', 'chart-area')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)


  //legend
  circles = {525: 'White', 550: 'Black', 575: 'Asian', 600: 'Hispanic'}

  for (var c in circles) {
  chart.append('circle')
        .attr('cx', 0)
        .attr('cy', c)
        .attr('r', 7)
        .attr('class', function(d) {
          var p
          if (circles[c] == 'White') {p = 'white-med'}
          else if (circles[c] == 'Black') {p = 'black-med'}
          else if (circles[c] == 'Asian') {p = 'asian-med'}
          else {p = 'hisp-med'}
          return p
        })


  chart.append('text')
        .attr('x', 10)
        .attr('y', c*1.01)
        .attr('class', 'legend-text')
        .text(circles[c])
  }

  //hover tooltips









}; //end of makeChart function
