var currentYear = "";

var isOverview = true;
var isYear = false;
var isTeam = false;

var parseDate = d3.timeParse("%Y-%m-%d");
var formatYear = d3.timeFormat("%Y");

var margin = { top: 50, right: 50, bottom: 50, left: 150 };
var width = 800;
var height = 400;

var svg = d3.select("#chart");
var tooltip;

function clearChart() {
    d3.select("#chart").select("svg").remove();
    tooltip.style("visibility", "hidden").text("");
    d3.select("body").style('cursor', 'default');
}


  tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

  function injuryYearsChart() {
    d3.csv("NBAPlayerInjury.csv")
    .then(function(data) {

        d3.select("#OverviewMenu").attr("class", "active");
        d3.select("#YearMenu").attr("class", "");
        d3.select("#TeamMenu").attr("class", "");

        d3.select("#narrative_text").text(`
        This narrative overviews the number of injuries throughout the history of the National Basketball Association
        (NBA). This drill-down narrative starts with the below displayed line chart showcasing the total number of player
        per year. There appears to be a vast increase in injuries starting in the 1990s, and a closer look at these injuries
        may provide further details. Please click on the datapoint on a year to explore further.
        `);

        svg = d3.select("#chart")
            .append("svg") // Change the "svg" element to properly set the width and height
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var dataByYear = d3.nest()
            .key(function (d) {
                return formatYear(parseDate(d.Date));
            })
            .rollup(function (leaves) {
                return leaves.length;
            })
            .entries(data);

        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) {
                return formatYear(parseDate(d.Date));
            }))
            .range([0, width]);
        var y = d3.scaleLinear()
            .domain(d3.extent(dataByYear, function (d) {
                return d.value;
            }))
            .range([height, 0]);

        var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"));
        var yAxis = d3.axisLeft(y).tickFormat(d3.format("~s"));

        //annotations

        var annotations = [
                //moved recession annotation to front of array so it's behind
                //the Macbook Air annotation
                {
                  note: {
                    title: "Spike in injuries",
                    lineType: "none",
                    align: "middle",
                    wrap: 150 //custom text wrapping
                  },
                  subject: {
                    height: height,
                    width: x("2022") - x("1999")
                  },
                  type: d3.annotationCalloutRect,
                  y: 0.1,
                  disable: ["connector"], // doesn't draw the connector
                  //can pass "subject" "note" and "connector" as valid options
                  dx: (x("2021") - x("1999"))/2,
                  data: { x: "1998"}
                },
                {
                  subject: {
                    text: "A",
                      y: "top",
                    x: "left" //badges have an x of "left" or "right"
                  },
                  data: { x: "1990", y: 90}
                },
                {
                  subject: {
                      text: "B",
                      y: "bottom"
                  },
                  data: { x: "1998", y: 127}
                },
                {
                  subject: {
                    text: "C",
                    y: "bottom",
                    x: "right"
                  },
                  data: { x: "2022", y: 1582}
                }]

        const type = d3.annotationCustomType(
            d3.annotationBadge,
            {"subject":{"radius": 12 }}
          )

        var makeAnnotations = d3.annotation()
            .type(type)
            .accessors({
              x: function(d){ return x(d.x) },
              y: function(d){ return y(d.y) }
            })
            .annotations(annotations)

        svg.append("g")
            .call(makeAnnotations)

        svg.append("g")
            .append("path")
            .datum(dataByYear)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function (d) {
                    return x(d.key);
                })
                .y(function (d) {
                    return y(d.value);
                })
            );

        var circles = svg.selectAll("circle")
            .data(dataByYear)
            .enter().append("circle")
            .attr("cx", function (d) {
                return x(d.key);
            })
            .attr("cy", function (d) {
                return y(d.value);
            })
            .attr("r", 5)
            .style("fill", "maroon");

        circles
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip)
            .style("cursor", "pointer")
            .on("click", function (d) {
                clearChart();
                selectedYearChart(d.key);
                currentYear = d.key;

                isOverview = true;
                isYear = true;
                isTeam = false;
            });

        svg.append("g")
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .call(yAxis);

        svg.append("g")
            .attr("transform", "translate(" + 0 + "," + height + ")")
            .call(xAxis);

        // Create the x-axis label
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text("Year");

        // Create the y-axis label
        svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 100)
            .attr("text-anchor", "middle")
            .text("Number of injuries");

        svg.append("text")
            .attr("class", "title")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .attr("font-size", 20)
            .text("NBA Player Injuries from 1951-2023");

        // Annotations for legend
        svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom + 100) // Added 100 to make room for the legend
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const annotationsLegend = [
            { note: { label: "Injuries remain relatively flat until 1990" }, subject: { text: "A" }},
            { note: { label: "Injuries start rising" }, subject: { text: "B" }},
            { note: { label: "Injuries Peak" }, subject: { text: "C" }}
        ].map(function(d, i) {
            d.x = 90 + i*280;
            d.y = height + 80; // Adjusted to be below the chart
            d.subject.x = "right";
            return d;
        });

        const makeLegendAnnotations = d3.annotation()
            .type(d3.annotationBadge)
            .annotations(annotationsLegend);

        svg.append("g")
            .call(makeLegendAnnotations);

        svg.selectAll('text.legend')
            .data(annotationsLegend)
            .enter()
            .append('text')
            .attr('class', 'legend')
            .text(function(d) { return d.note.label })
            .attr('x', function(d, i) { return  5 + i*320 })
            .attr('y', height + 120); // Adjusted to be below the chart

    })
      .catch(function(error){
        console.log("Error detected in Overview code", error);
    })
  }


  function showTooltip(d) {
    tooltip.style("visibility", "visible")
      .text("Year: " + d.key + ", Total Injuries: " + d.value)
      .style("top", (d3.event.pageY - 10) + "px")
      .style("left", (d3.event.pageX + 10) + "px");
  }

  function moveTooltip() {
    tooltip.style("top", (d3.event.pageY - 10) + "px")
      .style("left", (d3.event.pageX + 10) + "px");
  }

  function hideTooltip() {
    tooltip.style("visibility", "hidden");
  }


  //Function that populates a treemap of injuries by team
  function selectedYearChart(Year) {
    d3.csv("NBAPlayerInjury.csv")
    .then(function(data) {

      d3.select("#OverviewMenu").attr("class", "active");
      d3.select("#YearMenu").attr("class", "active");
      d3.select("#TeamMenu").attr("class", "");

      d3.select("#narrative_text").text(`
        Drilling down, the selected year displays the share of the total injuries per team in the NBA. 
        The tree map visually breaks down the injury share to show which teams had the greatest share of injuries
        in the selected year. Each team has their number of injuries displayed next to their team name in parentheses.
        Please click on a team to see the injury breakdown.
        `);

      data = data.filter(function (el) {
          return (formatYear(parseDate(el.Date)) == Year);
      });

      var margin = { top: 30, right: 250, bottom: 140, left: 60 };
      var width = d3.select('#chart').node().getBoundingClientRect().width - margin.left - margin.right;
      var height = d3.select('#chart').node().getBoundingClientRect().height - margin.top - margin.bottom;


      svg = d3.select("#chart")
        .append("svg") // Change the "svg" element to properly set the width and height
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .style("cursor", "pointer")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Create a nested data structure with the count of each team
      var nestedData = d3.nest()
        .key(function(d) { return d.Team; })
        .rollup(function(leaves) { return leaves.length; })
        .entries(data);

      // Create a treemap layout
      var treemap = d3.treemap()
        .size([width, height]) // Specify the size of the treemap visualization
        .padding(1); // Set the padding between cells

      // Convert nestedData to a hierarchical structure
      var root = d3.hierarchy({ values: nestedData }, function(d) { return d.values; })
        .sum(function(d) { return d.value; });

      // Compute the treemap layout
      treemap(root);

      // Create the treemap visualization
      svg.selectAll("rect")
        .data(root.leaves())
        .enter()
        .append("rect")
        .attr("x", function(d) { return d.x0; })
        .attr("y", function(d) { return d.y0; })
        .attr("width", function(d) { return Math.max(0, d.x1 - d.x0 - 1); }) // subtract 1 for padding
        .attr("height", function(d) { return Math.max(0, d.y1 - d.y0 - 1); }) // subtract 1 for padding
        .style("fill", "navy")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .on("click", function(d) {
        // Handle the click event for each cell
          clearChart();
          selectedTeamChart(d.data.key, Year);
          currentTeam = d.data.key;

          isOverview = true;
          isYear = true;
          isTeam = true;
        });

      // Optionally, you can add text labels to the treemap cells
      svg.selectAll("text")
        .data(root.leaves())
        .enter()
        .append("text")
        .attr("x", function(d) { return d.x0 + 5; })
        .attr("y", function(d) { return d.y0 + 20; })
        .text(function(d) {
          return d.data.key + " (" + d.value + ")";
        })
        .attr("font-size", "12px")
        .attr("fill", "white");

      svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", 20)
        .text("Injuries by Team in " + Year);


    })
    .catch(function(error){
            console.log("Error detected in treemap code", error);
    })
  }

  //Function that populates a bar chart for a selected team
  function selectedTeamChart(Team, Year) {
      d3.csv("NBAPlayerInjury.csv")
      .then(function(data) {

        d3.select("#OverviewMenu").attr("class", "active");
        d3.select("#YearMenu").attr("class", "active");
        d3.select("#TeamMenu").attr("class", "active");

        d3.select("#narrative_text").text(`
        The types of injuries on the selected team are displayed in the barchart below. You may hover your
        cursor over each chart to see which players had that specific injury.
        `);

        data = data.filter(function (el) {
            return (formatYear(parseDate(el.Date)) == Year && el.Team == Team);
        });

        // Create a nested data structure with the count of each 'Notes' value
      var nestedData = d3.nest()
        .key(function(d) { return d.Notes; })
        .rollup(function(leaves) { return leaves.length; })
        .entries(data);

      // Sort the nestedData based on the count in descending order
      nestedData.sort(function(a, b) {
        return d3.descending(a.value, b.value);
      });

      // Set up the SVG container and dimensions for the bar chart
      var margin = { top: 30, right: 20, bottom: 450, left: 140 };
      var width = d3.select('#chart').node().getBoundingClientRect().width - margin.left - margin.right;
      var height = d3.select('#chart').node().getBoundingClientRect().height - margin.top - margin.bottom;

      var g = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Set up the scales for the x-axis and y-axis
      var x = d3.scaleBand()
        .domain(nestedData.map(function(d) { return d.key; }))
        .range([0, width])
        .padding(0.1);

        var y;
        if (nestedData.length === 1) {
          y = d3.scaleLinear()
            .domain([0, nestedData[0].value + 1]) // Add 1 or some fraction of the value to the maximum value in the domain for a single data point
            .range([height, 0]);
        } else {
          y = d3.scaleLinear()
            .domain([0, d3.max(nestedData, function(d) { return d.value; })])
            .range([height, 0]);
        }

      // Create the bars of the bar chart
      g.selectAll(".bar")
        .data(nestedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.key); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .style("fill", "maroon")
        .on("mouseover", function(d) {
          // Show tooltip with 'Relinquished' value on mouseover
          tooltip.text(d.key + ": " + d.value + " (" + getRelinquishedValues(data, d.key).join(", ") + ")");
          tooltip.style("visibility", "visible");
        })
        .on("mousemove", function() {
          // Position the tooltip relative to the mouse pointer
          tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
          // Hide tooltip on mouseout
          tooltip.style("visibility", "hidden");
        });

      // Create the x-axis
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dy", "0.5em")
        .attr("dx", "-0.8em");

      // Create the y-axis
      g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format(".0f")));

      // Create the x-axis label
        g.append("text")
          .attr("class", "x-axis-label")
          .attr("x", width / 2)
          .attr("y", height + margin.top + 170)
          .attr("text-anchor", "middle")
          .text("Injury Reason");

        // Create the y-axis label
        g.append("text")
          .attr("class", "y-axis-label")
          .attr("transform", "rotate(-90)")
          .attr("x", -height/2 )
          .attr("y", -margin.left + 60)
          .attr("text-anchor", "middle")
          .text("Number of injuries");

      // Create the title
        g.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .attr("font-size", 20)
            .text("Type of Injuries on the " + Team + " in " + Year);

      // Create the tooltip element
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden");

      // Helper function to get the 'Relinquished' value for a given 'Notes' value
      function getRelinquishedValues(data, notes) {
        var matches = data.filter(function(d) {
          return d.Notes === notes;
        });
        return matches.map(function(d) {
          return d.Relinquished;
        });
      }


    })
    .catch(function(error){
            console.log("Error detected in barchart code", error);
    })
  }

  // Update the SVG width and height to match the window dimensions
function updateChartSize() {
  var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

  svg.attr("width", width).attr("height", height);
}

window.addEventListener("resize", updateChartSize);

async function init() {
  updateChartSize()
  injuryYearsChart();

}

window.addEventListener("DOMContentLoaded", init);

