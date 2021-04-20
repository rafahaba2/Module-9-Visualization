# Italy Covid-19: Task 3

This Task consists on an Italy's map where coronavirus' cases are represented in the different regions using circles. The bigger the circles are, more cases there are in each community, also it has been added a colour palette for each community depending of the number of cases. Two buttons have been added to the map, so we can see which regions where more affected in the beginning are in the lasts 14 days.

## Initial Covid Representation in Italy
![Initial covid map](./content/italyinit.PNG "initial covid map")

## Last 14 days Covid Representation in Italy
![Last covid map](./content/italylast.PNG "lastcovid map")

# Steps

```bash
npm install
```

- When you deal with maps you can use two map formats GeoJSON or TopoJSON, topo JSON is lightweight and offers some extra
  features, let's install the needed packages to work with:

```bash
npm install topojson-client --save
```

```bash
npm install @types/topojson-client --save-dev
```

- Let's install topojson:

```bash
npm install topojson --save
```

```bash
npm install @types/topojson --save-dev
```

- Let's install the _composite projections_ project to display the Canary Island just below spain.

```bash
npm install d3-composite-projections --save
```

- Let's import topojson, the json from Spain, the file that contains latitude and longitude  of the Spain's communities and the projections project that we use to place the Canary islands near the Peninsula ibérica. Also the covid stats must to be imported.

_./src/index.ts_
```typescript
import * as d3 from "d3";
import { interpolateMagma } from "d3";
import { on } from "node:events";
import * as topojson from "topojson-client";
const italyjson = require("./italy.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";

import { statsIni, statsLast, ResultEntry } from "./covid";
```

- Assign a background color for every region depending of the number of cases. I have chosen a palette from green to black and some divisions for the domain, depending it of the maxValue of the input data.
```typescript
const assignRegionsBackgroundColor = (comunidad: string, s: ResultEntry[]) => {
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
      "#3aad21",
      "#348e1f",
      "#2d701d",
      "#255419",
      "#1d3915",
      "#000000",
    ]);

  return item ? color(item.value) : color(0);
};

```
- This function give us the number of cases that the most affected community has.
```typescript
const maxAffected = (s: ResultEntry[]) => {
  const max = s.reduce((max, item) => (item.value > max ? item.value : max), 0);
  return max;
};
```

- This function is used to calculate the radius that every region must have. The most affected region is going to have the biggest circle, it should dicrease linearly for the other regions. It is very important to know that these radius are calculated in order to the data that is represented, NOT in order of all the data that we have, it means that similar radius between Initial cases and Last cases DOES NOT MEAN similar number of cases. I have done like this because the number of cases at the beginning were very small in comparison to the last number of cases, meaning that circles with data of the covid beginnings should be very small.

``` typescript
const calculateRadiusBasedOnAffectedCases = (
  comunidad: string,
  s: ResultEntry[]
) => {
  const entry = s.find((item) => item.name === comunidad);

  const affectedRadiusScale = d3
    .scaleLinear()
    .domain([0, maxAffected(s)])
    .range([0, 50]);

  return entry ? affectedRadiusScale(entry.value) : 0;
};
```

- Setting the Italy projection, translation and scale.
```typescript
const aProjection = d3
  .geoMercator()
  // Let's make the map bigger to fit in our resolution
  .scale(2200)
  // Let's center the map
  .translate([10, 2100]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(italyjson, italyjson.objects.ITA_adm1);
```
- Setting a background color and rendering map
```typescript
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
    return assignRegionsBackgroundColor(d.properties.NAME_1, statsIni);
  })
  .attr("d", geoPath as any);

```

- Setting the initial state of the map with stats of the covid beginnings
```typescript
svg
  .selectAll("circle")
  .data(latLongCommunities)
  .enter()
  .append("circle")
  .attr("class", "affected-marker")
  .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, statsIni))
  .attr("cx", (d) => aProjection([d.long, d.lat])[0])
  .attr("cy", (d) => aProjection([d.long, d.lat])[1])
  ;
```
- Function for updating the circles radius when clicking a button.
```typescript
const updateRadius = (data: ResultEntry[]) => {
  d3.selectAll("circle")
    .data(latLongCommunities)
    .transition()
    .duration(500)
    .attr("class", "affected-marker")
    .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, data))
    .attr("cx", (d) => aProjection([d.long, d.lat])[0])
    .attr("cy", (d) => aProjection([d.long, d.lat])[1])
};
```
- Function for updating the communities background color.
```typescript
const updateRegionsColor = (data: ResultEntry[]) => {
  d3.selectAll("path")
    .data(geojson["features"])
    .transition()
    .duration(500)
    .attr("class", "country")
    .style("fill", function (d: any) {
      return assignRegionsBackgroundColor(d.properties.NAME_1, data);
    })
    .attr("d", geoPath as any);
};
```

- Getting the id of the buttons and listening to an event, then update the radius and the background color of every community depending of the button selected.
```typescript
document
  .getElementById("Inicio")
  .addEventListener("click", function handlResultsIni() {
    updateRadius(statsIni);
    updateRegionsColor(statsIni);
  });

document
  .getElementById("Final")
  .addEventListener("click", function handlResultsFinal() {
    updateRadius(statsLast);
    updateRegionsColor(statsLast);
  });
  ```
  _./src/map.css_
  - Color for the country and the circles.
  ```css
.affected-marker {
  stroke-width: 1;
  stroke: #bc5b40;
  fill: #f88f70;
  fill-opacity: 0.7;
}
  
  ```
  _./src/index.html_
  - Defining the buttons ids and importing the css and index.ts
  
  ```
<html>
  <head>
    <link rel="stylesheet" type="text/css" href="./map.css" />
  </head>
  <div>
    <button id="Inicio">Initial Cases</button>
    <button id="Final">Last 14 days Cases</button>
  </div>
  <body>
    <script src="./index.ts"></script>
  </body>
</html>

  ```

