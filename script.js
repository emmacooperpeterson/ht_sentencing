//set margins
var margin = {top: 100, right: 100, bottom: 100, left: 100};
var width = 1000;
var height = 800;

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
  chart = d3.select("#chart")
          .append('svg')
          .attr("width", width)
          .attr("height", height);

};
