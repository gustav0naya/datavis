var headingCount = 1;

async function init() {
  var margin = { top: 50, right: 50, bottom: 50, left: 50 },
    width = 200,
    height = 200;

  var x = d3.scaleLog().base(10).domain([10, 150]).range([0, width]);
  var y = d3.scaleLog().base(10).domain([10, 150]).range([height, 0]);

  var xAxis = d3.axisBottom(x).tickValues([10, 20, 50, 100]).tickFormat(d3.format("~s"));
  var yAxis = d3.axisLeft(y).tickValues([10, 20, 50, 100]).tickFormat(d3.format("~s"));

  var svg = d3.select("#chart")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var data = await d3.csv("cars2017.csv");

  var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");
  function clearChart() {
    svg.selectAll("*").remove();
  }

  function drawInitialChart() {
    var circles = svg.selectAll("circle")
      .data(data)
      .enter().append("circle")
      .attr("cx", function (d) { return x(+d.AverageCityMPG); })
      .attr("cy", function (d) { return y(+d.AverageHighwayMPG); })
      .attr("r", function (d) { return 2 + +d.EngineCylinders; });

    circles
      .on("mouseover", showTooltip)
      .on("mousemove", moveTooltip)
      .on("mouseout", hideTooltip);

    svg.append("g")
      .attr("transform", "translate(" + 0 + "," + 0 + ")")
      .call(yAxis);

    svg.append("g")
      .attr("transform", "translate(" + 0 + "," + height + ")")
      .call(xAxis);
  }

  drawInitialChart();

  function showTooltip(d) {
    tooltip.style("visibility", "visible")
      .text("Average City MPG: " + d.AverageCityMPG + ", Average Highway MPG: " + d.AverageHighwayMPG)
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

  document.getElementById("updateButton").addEventListener("click", updateChart);

  function updateChart() {
    clearChart();
    drawScatterPlot();

    var heading = document.getElementById("heading");
    heading.textContent = "Heading " + headingCount;
    headingCount++;
  }

  async function drawScatterPlot() {
    var data = await d3.csv("cars2017.csv");

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