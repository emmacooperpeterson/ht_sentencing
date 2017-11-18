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

  makeChart();
});

function makeChart() {
  console.log(dataset);

  //set up svg
  svg = d3.select("#chart")
          .append('svg')
          .attr("width", totalWidth)
          .attr("height", totalHeight)
          .attr("transform", "translate(" + 4*margin.left + "," + margin.top + ")");

  var chart = svg.append('g')
                  .attr("transform", "translate(" + 50 + "," + 65 + ")");

  //var sidebar = svg.append('g')
    //                .attr('transform', 'translate(' + margin.left/2.5 + ',' + margin.top/1.5 + ')')


  //create scales
  var xScale = d3.scaleBand()
                  .domain(dataset.map(function(d) {return d.judge_race;}))
                  .range([0,height])

  var yScale = d3.scaleLinear()
                  .domain([d3.max(dataset, function(d) {return d.sentence;}), 0])
                  .range([width, 0]);


  //y axis
  chart.append('g')
      .call(d3.axisTop(yScale)
              .tickSizeInner(0)
              .tickSizeOuter(0)
              .tickPadding(10))
      .attr('id', 'y-ticks')

      //gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
      function make_x_gridlines() {
        return d3.axisBottom(yScale)
      }

      //add the gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
      chart.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + height + ")")
            .call(make_x_gridlines()
                .tickSize(-height)
                .tickFormat("")
            )


      //remove horizonal line of y axis https://bl.ocks.org/mbostock/3371592
      function customYAxis(g) {
            chart.call(yScale);
            chart.select(".domain").remove(); }

      chart.append("g")
           .call(customYAxis);

      chart.append("g")
            .call(customYAxis);

  //y axis labels
  chart.append("text")
    .attr("class", "axisLabel")
    .attr("y", -35)
    .attr("x", 340)
    .text("Number of Cases");


  //judge_race
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
      .entries(dataset);
  console.log(judgeRace);



  //append circles
  chart.selectAll(".circle")
    .data(judgeRace)
    .enter()
    .append("circle")
    .attr("class", "circle")
    .attr("cy", function(d) {return xScale(d.key) + xScale.bandwidth()/2;})
    .attr("cx", function(d) {return yScale(d.value.median);})
    .attr("r", 15)
    .attr("class", function(d) {
          var c
          if (d.key == 0) {c = 'white-med'}
          else if (d.key == 1) {c = 'black-med'}
          else if (d.key == 2) {c = 'hisp-med'}
          else if (d.key == 3) {c = 'asian-med'}
          else if (d.key == 4) {c = 'indian-med'}
          else if (d.key == 5) {c = 'other-med'}
          else {c = 'nan-med'}
          return c
    });

    //append max lines
    chart.selectAll(".rect")
      .data(judgeRace)
      .enter()
      .append("rect")
      .attr("class", "rect")
      .attr("x", function(d) {return yScale(d.value.q3);})
      .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2.3;})
      .attr("width", function(d) {return yScale(d.value.max - d.value.q3);})
      .attr("height", 12)
      .attr("class", function(d) {
            var c
            if (d.key == 0) {c = 'white-max'}
            else if (d.key == 1) {c = 'black-max'}
            else if (d.key == 2) {c = 'hisp-max'}
            else if (d.key == 3) {c = 'asian-max'}
            else if (d.key == 4) {c = 'indian-max'}
            else if (d.key == 5) {c = 'other-max'}
            else {c = 'nan-max'}
            return c
      });


    //append min lines
    chart.selectAll(".rect")
          .data(judgeRace)
          .enter()
          .append("rect")
          .attr("class", "rect")
          .attr("x", function(d) {return yScale(d.value.min);})
          .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2.3;})
          .attr("width", function(d) {return yScale(d.value.q1 - d.value.min);})
          .attr("height", 12)
          .attr("class", function(d) {
                var c
                if (d.key == 0) {c = 'white-max'}
                else if (d.key == 1) {c = 'black-max'}
                else if (d.key == 2) {c = 'hisp-max'}
                else if (d.key == 3) {c = 'asian-max'}
                else if (d.key == 4) {c = 'indian-max'}
                else if (d.key == 5) {c = 'other-max'}
                else {c = 'nan-max'}
                return c
          });


    //append iqr lines
    chart.selectAll(".rect")
          .data(judgeRace)
          .enter()
          .append("rect")
          .attr("class", "rect")
          .attr("x", function(d) {return yScale(d.value.q1);})
          .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2.3;})
          .attr("width", function(d) {return yScale(d.value.q3 - d.value.q1);})
          .attr("height", 12)
          .attr("class", function(d) {
                var c
                if (d.key == 0) {c = 'white-iqr'}
                else if (d.key == 1) {c = 'black-iqr'}
                else if (d.key == 2) {c = 'hisp-iqr'}
                else if (d.key == 3) {c = 'asian-iqr'}
                else if (d.key == 4) {c = 'indian-iqr'}
                else if (d.key == 5) {c = 'other-iqr'}
                else {c = 'nan-iqr'}
                return c
          });




  //title
  //svg.append("text")
    //  .attr("class", "title")
      //.attr("y", margin.left / 2)
    //  .attr("x", margin.left / 2.5)
    //  .style("text-anchor", "left")
    //  .text('Human Trafficking in the United States: How Do Prison Sentences Vary?');


//sidebar
//sidebar.append("text")
  //  .attr("class", "side-header")
    //.style("text-anchor", "left")
    //.text('Include:');


var options = ['Judge race', 'Judge gender', 'Judge party affiliation',
                'Defendant race', 'Defendant gender', 'Victim gender',
                'Victim origin', 'Method of recruitment', 'Type of trafficking',
                'U.S. region'];












};
