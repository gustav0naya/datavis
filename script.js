var currentYear = "";

var isOverview = true;
var isYear = false;
var isTeam = false;

var parseDate = d3.timeParse("%Y-%m-%d");
var formatYear = d3.timeFormat("%Y");

var margin = { top: 50, right: 50, bottom: 50, left: 150 };
var width = 800;
var height = 400;

var svg;
var tooltip;

function clearChart() {
    d3.select("#chart").select("svg").remove();
    tooltip.style("visibility", "hidden").text("");
    d3.select("body").style('cursor', 'default');
    svg = d3.select("#chart")
    .append("svg") // Change the "svg" element to properly set the width and height
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

  svg = d3.select("#chart")
    .append("svg") // Change the "svg" element to properly set the width and height
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
        (NBA). This drill-down narrative starts with the below displayed line chart showcasing hte total number of player
        per year. There appears to be a vast increase in injuries starting in the 1990s, and a closer look at these injuries
        may provide further details. 
        `);

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
            .attr("r", 5);

        circles
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip)
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
        `);

      data = data.filter(function (el) {
          return (formatYear(parseDate(el.Date)) == Year);
      });
      console.log(data[0]["Team"]);

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
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .style("fill", "navy")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .on("click", function(d) {
        // Handle the click event for each cell
          console.log("Clicked on cell:", d.data.key);
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
        .text("Injuries by Team in " + Year);


    })
    .catch(function(error){
            console.log("Error detected in Year code");
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
        console.log(data[1]["Relinquished"]);

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
      var margin = { top: 20, right: 20, bottom: 60, left: 60 };
      var width = 800 - margin.left - margin.right;
      var height = 400 - margin.top - margin.bottom;

      svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Set up the scales for the x-axis and y-axis
      var x = d3.scaleBand()
        .domain(nestedData.map(function(d) { return d.key; }))
        .range([0, width])
        .padding(0.1);

      var y = d3.scaleLinear()
        .domain([0, d3.max(nestedData, function(d) { return d.value; })])
        .range([height, 0]);

      // Create the bars of the bar chart
      svg.selectAll(".bar")
        .data(nestedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.key); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
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
      svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dy", "0.5em")
        .attr("dx", "-0.8em");

      // Create the y-axis
      svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

      // Create the x-axis label
        svg.append("text")
          .attr("class", "x-axis-label")
          .attr("x", width / 2)
          .attr("y", height + margin.top + 40)
          .attr("text-anchor", "middle")
          .text("Injury Reason");

        // Create the y-axis label
        svg.append("text")
          .attr("class", "y-axis-label")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", -margin.left + 20)
          .attr("text-anchor", "middle")
          .text("Number of injuries");

      // Create the title
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
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
            console.log("Error detected in Year code");
    })
  }
async function init() {


  injuryYearsChart();


  async function drawScatterPlot() {
    var data = await d3.csv("NBAPlayerInjury.csv");

    var x = d3.scaleLog().base(10).domain([10, 150]).range([0, 200]);
    var y = d3.scaleLog().base(10).domain([10, 150]).range([200, 0]);

    var circles = svg.selectAll("circle")
      .data(data)
      .enter().append("circle")
      .attr("cx", function (d) { return x(Math.random() * 140 + 10); })
      .attr("cy", function (d) { return y(Math.random() * 140 + 10); })
      .attr("r", 2);

    circles
      .on("mouseover", showTooltip)
      .on("mousemove", moveTooltip)
      .on("mouseout", hideTooltip);

  }
}

window.addEventListener("DOMContentLoaded", init);