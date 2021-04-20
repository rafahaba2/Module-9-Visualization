import * as d3 from "d3";
import { interpolateMagma } from "d3";
import { on } from "node:events";
import * as topojson from "topojson-client";
const italyjson = require("./italy.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";

import { statsIni, statsLast, ResultEntry } from "./covid";

const assignCountryBackgroundColor = (comunidad: string, s: ResultEntry[]) => {
  const item = s.find((item) => item.name === comunidad);
  var maxValue: number = maxAffected(s);
  var divisions = maxValue / 5;

  const color = d3
    .scaleThreshold<number, string>()
    .domain([
      0,
      maxValue - 4 * divisions,
      maxValue - 3 * divisions,
      maxValue - 2 * divisions,
      maxValue - divisions,
      maxValue,
    ])
    .range([
      "#FFFFF",
      "#FFE8E5",
      "#F88F70",
      "#CD6A4E",
      "#A4472D",
      "#7B240E",
      "#540000",
    ]);

  return item ? color(item.value) : color(0);
};

const maxAffected = (s: ResultEntry[]) => {
  const max = s.reduce((max, item) => (item.value > max ? item.value : max), 0);
  return max;
};

const calculateRadiusBasedOnAffectedCases = (
  comunidad: string,
  s: ResultEntry[]
) => {
  const entry = s.find((item) => item.name === comunidad);

  const affectedRadiusScale = d3
    .scaleLinear()
    .domain([0, maxAffected(s)])
    .range([0, 30]);

  return entry ? affectedRadiusScale(entry.value) : 0;
};

const aProjection = d3
  .geoMercator()
  // Let's make the map bigger to fit in our resolution
  .scale(1700)
  // Let's center the map
  .translate([10, 1600]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(italyjson, italyjson.objects.ITA_adm1);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  .style("fill", function (d: any) {
    return assignCountryBackgroundColor(d.properties.NAME_1, statsIni);
  })
  .attr("d", geoPath as any);

svg
  .selectAll("circle")
  .data(latLongCommunities)
  .enter()
  .append("circle")
  .attr("class", "affected-marker")
  .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, statsIni))
  .attr("cx", (d) => aProjection([d.long, d.lat])[0])
  .attr("cy", (d) => aProjection([d.long, d.lat])[1]);

const updateRadius = (data: ResultEntry[]) => {
  d3.selectAll("circle")
    .data(latLongCommunities)
    .transition()
    .duration(500)
    .attr("class", "affected-marker")
    .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, data))
    .attr("cx", (d) => aProjection([d.long, d.lat])[0])
    .attr("cy", (d) => aProjection([d.long, d.lat])[1]);
};

const updateCommunitiesColor = (data: ResultEntry[]) => {
  d3.selectAll("path")
    .data(geojson["features"])
    .transition()
    .duration(500)
    .attr("class", "country")
    .style("fill", function (d: any) {
      return assignCountryBackgroundColor(d.properties.NAME_1, data);
    })
    .attr("d", geoPath as any);
};

document
  .getElementById("Inicio")
  .addEventListener("click", function handlResultsIni() {
    updateRadius(statsIni);
    updateCommunitiesColor(statsIni);
  });

document
  .getElementById("Final")
  .addEventListener("click", function handlResultsFinal() {
    updateRadius(statsLast);
    updateCommunitiesColor(statsLast);
  });
