const map = L.map("mapid").setView([51.050043, 3.719926], 10);

L.tileLayer(
  "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
  {
    attribution:
      "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken:
      "pk.eyJ1IjoibWF4aW10bWFydGluIiwiYSI6ImNqcHdqbjdhaDAzYzc0Mm04eDFhamkzenMifQ.0uNbKJ2WHATkKBBSADuhyQ"
  }
).addTo(map);

const planner = new PlannerJS.FlexibleTransitPlanner();
planner.addConnectionSource("https://graph.irail.be/sncb/connections");
planner.addStopSource("https://irail.be/stations/NMBS");

planner.prefetchStops();
planner.prefetchConnections(new Date(), new Date(new Date().getTime() + 2 * 60 * 60 * 1000));

console.log(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));

let plannerResult;
const usePublicTransport = document.querySelector('#usePublicTransport');
const resetButton = document.querySelector("#reset");
const results = document.querySelector("#results");
const prefetchWrapper = document.querySelector("#prefetch");
const prefetchBar = document.querySelector("#prefetch-bar");
let prefetchBarWidth = 0;
let roadNetworkOnly = false;

let lines = [];
let polyLines = [];
let resultObjects = [];
let query = [];
let allStops = [];
let prefetchViews = [];

let earliestFetch;
let latestFetch;

const removeStops = () => {
  for (const stop of allStops) {
    stop.remove();
  }
};

const removeLines = () => {
  for (const line of polyLines) {
    line.remove();
  }

  lines = [];
  polyLines = [];
};

const removeResultObjects = () => {
  for (const obj of resultObjects) {
    obj.remove();
  }

  resultObjects = [];
};

const removePrefetchView = () => {
  const view = document.getElementById("prefetch");

  if (!view.hasChildNodes()) {
    return;
  }

  for (const child of [...view.childNodes]) {
    if (!child.id) {
      child.parentNode.removeChild(child);
    }
  }
};

usePublicTransport.onclick = e => {
  if (!usePublicTransport.checked) {
    roadNetworkOnly = true;
    removeStops();
  } else {
    roadNetworkOnly = false;
    for (const stop of allStops) {
      stop.addTo(map);
    }
  }
};

resetButton.onclick = (e) => {
  document.getElementById('loading').style.display = 'none';
  removeLines();
  removeResultObjects();
  query = [];
  results.innerHTML = "";

  if (usePublicTransport.checked) {
    for (const stop of allStops) {
      stop.addTo(map);
    }
  }

  if (plannerResult) {
    plannerResult.close();
  }

  removePrefetchView();
};

const pxPerMs = .00005;
const getPrefetchViewWidth = (start, stop) => {
  if (!start || !stop) {
    return 0;
  }

  return (stop.valueOf() - start.valueOf()) * pxPerMs;
};

planner.getAllStops().then(stops => {
  for (const stop of stops) {
    if (stop["avgStopTimes"] > 100000) {
      const marker = L.marker([stop.latitude, stop.longitude]).addTo(map);

      marker.bindPopup(stop.name);

      allStops.push(marker);

      marker.on('mouseover', e => {
        marker.openPopup();
      });
      marker.on('mouseout', e => {
        marker.closePopup();
      });
      marker.on("click", e => {
        selectRoute(e, stop.id);
      });
    }
  }
});

PlannerJS.EventBus
  .on(PlannerJS.EventType.Query, query => {
    console.log("Query", query);
  })
  .on(PlannerJS.EventType.SubQuery, query => {
    const { minimumDepartureTime, maximumArrivalTime, maximumTravelDuration } = query;

    console.log(
      "[Subquery]",
      minimumDepartureTime,
      maximumArrivalTime,
      maximumArrivalTime - minimumDepartureTime,
      maximumTravelDuration
    );

    removeLines();
  })
  .on(PlannerJS.EventType.InitialReachableStops, reachableStops => {
    /*console.log("initial", reachableStops);
    reachableStops.map(({ stop }) => {
      const startMarker = L.marker([stop.latitude, stop.longitude]).addTo(map);

      startMarker.bindPopup("initialreachable: " + stop.name);

      resultObjects.push(startMarker);
    });*/
  })
  .on(PlannerJS.EventType.FinalReachableStops, reachableStops => {
    /*console.log("final", reachableStops);

    reachableStops.map(({ stop }) => {
      const startMarker = L.marker([stop.latitude, stop.longitude]).addTo(map);

      startMarker.bindPopup("finalreachable: " + stop.name);

      resultObjects.push(startMarker);
    });*/
  })
  .on(PlannerJS.EventType.AddedNewTransferProfile, ({ departureStop, arrivalStop, amountOfTransfers }) => {
    /*
    const newLine = [
      [departureStop.latitude, departureStop.longitude],
      [arrivalStop.latitude, arrivalStop.longitude]
    ];

    let lineExists = lines.length > 0 && lines
      .some((line) =>
        line[0][0] === newLine[0][0]
        && line[0][1] === newLine[0][1]
        && line[1][0] === newLine[1][0]
        && line[1][1] === newLine[1][1]
      );

    if (!lineExists) {
      const polyline = new L.Polyline(newLine, {
        color: "#000",
        weight: 1,
        smoothFactor: 1,
        opacity: 0.5,
        dashArray: "10 10"
      }).addTo(map);

      lines.push(newLine);
      polyLines.push(polyline);
      
    }
    */
  })
  .on(PlannerJS.EventType.ConnectionPrefetch, (departureTime) => {
    /*if (!earliestFetch) {
      earliestFetch = departureTime;
    }

    if (!latestFetch) {
      latestFetch = departureTime;
    }

    earliestFetch = new Date(Math.min(departureTime, earliestFetch));
    latestFetch = new Date(Math.max(departureTime, latestFetch));
    prefetchBar.innerHTML = earliestFetch.toLocaleTimeString();

    const width = getPrefetchViewWidth(earliestFetch, latestFetch);

    prefetchBarWidth = width + 10;

    const prefetch = document.getElementById("prefetch");
    prefetch.style.width = `${prefetchBarWidth}px`;

    prefetchBar.style.width = `${width}px`;
    prefetchBar.setAttribute("data-last", latestFetch.toLocaleTimeString());

    drawPrefetchViews();*/
  })
  .on(PlannerJS.EventType.ConnectionIteratorView, (lowerBound, upperBound, completed) => {
    /*if (!lowerBound || !upperBound) {
      return;
    }

    if (!completed) {
      const width = getPrefetchViewWidth(lowerBound, upperBound);
      const offset = getPrefetchViewWidth(earliestFetch, lowerBound);

      const prefetchView = document.createElement("div");
      prefetchView.className = "prefetch-view";
      prefetchView.style.marginLeft = `${offset}px`;
      prefetchView.style.width = `${width * 100 / prefetchBarWidth}%`;
      prefetchView.style.backgroundColor = "red";

      prefetchWrapper.appendChild(prefetchView);
      prefetchViews.push({ lowerBound, upperBound, elem: prefetchView });

    } else {
      const { elem } = prefetchViews
        .find((view) => view.lowerBound === lowerBound && view.upperBound === upperBound);

      if (!elem) {
        return;
      }

      drawPrefetchViews();

      elem.style.backgroundColor = "limegreen";
    }*/
  })
  .on(PlannerJS.EventType.Warning, (warning) => {
    console.warn(warning);
  });

function drawPrefetchViews() {
  for (const prefetchView of prefetchViews) {
    const viewWidth = getPrefetchViewWidth(prefetchView.lowerBound, prefetchView.upperBound);
    const offset = getPrefetchViewWidth(earliestFetch, prefetchView.lowerBound);

    prefetchView.elem.style.width = `${viewWidth * 100 / prefetchBarWidth}%`;
    prefetchView.elem.style.marginLeft = `${offset}px`;
  }
}

function onMapClick(e) {
  selectRoute(e);
}

function selectRoute(e, id) {
  if (query.length === 2) {
    return;
  }

  let marker = L.marker(e.latlng).addTo(map);

  resultObjects.push(marker);

  if (query.length < 2) {
    const { lat, lng } = e.latlng;

    let item = {
      latitude: lat,
      longitude: lng
    };

    if (id) {
      item.id = id;
    }

    query.push(item);
  }

  if (query.length === 2) {
    runQuery(query);

    for (const marker of allStops) {
      marker.remove();
    }
  }
}

function appendLeadingZeroes(n) {
  if (n <= 9) {
    return "0" + n;
  }
  return n
}

function dateToTimeString(date) {
  return date.getFullYear() + "-" +
    appendLeadingZeroes(date.getMonth() + 1) + "-" +
    appendLeadingZeroes(date.getDate()) + " " +
    appendLeadingZeroes(date.getHours()) + ":" +
    appendLeadingZeroes(date.getMinutes()) + ":" +
    appendLeadingZeroes(date.getSeconds()
    )
}

map.on("click", onMapClick);

function getRandomColor() {
  const letters = "23456789AB";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 10)];
  }
  return color;
}

function addResultPanel(query, path, color) {
  const pathElement = document.createElement("div");
  pathElement.className = "path";

  const travelTime = path.getTravelTime(query);
  const startTime = path.getDepartureTime(query);
  const stopTime = path.getArrivalTime(query);
  const transferTime = Number.isNaN(path.getTransferTime(query)) ? 0 : path.getTransferTime(query);

  const headerElement = document.createElement("div");
  headerElement.className = "header";

  headerElement.innerHTML = `
    Departure: ${dateToTimeString(startTime)}<br/>
    Arrival: ${dateToTimeString(stopTime)}<br/>
    Travel time: ${Number(travelTime / 60000).toFixed(1)} min<br/>
    Transfer time: ${Number(transferTime / 60000).toFixed(1)} min
  `;

  pathElement.appendChild(headerElement);
  for (const leg of path.legs) {
    drawLeg(leg, pathElement, color);
  }

  results.appendChild(pathElement);
}

function drawLeg(leg, pathElement, color) {
  const stepElement = document.createElement("div");
  stepElement.className = "step";

  const travelMode = document.createElement("div");
  travelMode.className = "travelMode " + leg.travelMode;
  stepElement.appendChild(travelMode);

  const details = document.createElement("div");
  details.className = "details";
  stepElement.appendChild(details);

  const startLocation = document.createElement("div");
  startLocation.className = "startLocation";
  let startln;
  if (leg.getStartLocation().name) {
    startln = `${leg.getStartLocation().name} `;
  } else {
    startln = `${Number(leg.getStartLocation().latitude).toFixed(4)}, ${Number(leg.getStartLocation().longitude).toFixed(4)}`;
  }
  startLocation.innerHTML = "Start location: " + startln;
  details.appendChild(startLocation);

  if (leg.getStartTime()) {
    const startTime = document.createElement("div");
    startTime.className = "startTime";
    startTime.innerHTML = `Departure time: ${dateToTimeString(leg.getStartTime())}`;
    details.appendChild(startTime);
  }

  if (leg.getExpectedDuration()) {
    const duration = document.createElement("div");
    duration.className = "duration";
    duration.innerHTML =
      `Duration: ${Number(leg.getExpectedDuration() / (60 * 1000)).toFixed(1)} min`;
    details.appendChild(duration);
  }

  const stopLocation = document.createElement("div");
  stopLocation.className = "stopLocation";
  let stopln;
  if (leg.getStopLocation().name) {
    stopln = `${leg.getStopLocation().name} `;
  } else {
    stopln = `${Number(leg.getStopLocation().latitude).toFixed(4)}, ${Number(leg.getStopLocation().longitude).toFixed(4)}`;
  }
  stopLocation.innerHTML = "Stop location: " + stopln;
  details.appendChild(stopLocation);

  if (leg.getStopTime()) {
    const stopTime = document.createElement("div");
    stopTime.className = "stopTime";
    stopTime.innerHTML = `Arrival time: ${dateToTimeString(leg.getStopTime())}`;
    details.appendChild(stopTime);
  }

  pathElement.style.borderLeft = "5px solid " + color;

  pathElement.appendChild(stepElement);
}

function addResultToMap(q, path, color) {
  for (const leg of path.legs) {
    addConnectionMarkers(leg, color);
  }
}

function addConnectionMarkers(leg, color) {
  const startLocation = leg.getStartLocation();
  const stopLocation = leg.getStopLocation();
  const travelMode = leg.getTravelMode();

  const startMarker = L.marker([
    startLocation.latitude,
    startLocation.longitude
  ]).addTo(map);

  startMarker.bindPopup(startLocation.name);

  const stopMarker = L.marker([
    stopLocation.latitude,
    stopLocation.longitude
  ]).addTo(map);

  stopMarker.bindPopup(stopLocation.name);

  resultObjects.push(startMarker, stopMarker);

  for (const step of leg.steps) {
    const line = [
      [step.startLocation.latitude, step.startLocation.longitude],
      [step.stopLocation.latitude, step.stopLocation.longitude]
    ];

    drawLineBetweenPoints(line, travelMode, color);
  }
}

function drawLineBetweenPoints(line, travelMode, color) {
  const polyline = new L.Polyline(line, {
    color,
    weight: 5,
    smoothFactor: 1,
    opacity: 0.7,
    dashArray: travelMode === "profile" ? "8 8" : null
  }).addTo(map);

  resultObjects.push(polyline);
}

function runQuery(query) {
  document.getElementById('loading').style.display = 'block';

  const departureCircle = L.circle([query[0].latitude, query[0].longitude], {
    color: "limegreen",
    fillColor: "limegreen",
    fillOpacity: 0.5,
  }).addTo(map);

  const arrivalCircle = L.circle([query[1].latitude, query[1].longitude], {
    color: "red",
    fillColor: "red",
    fillOpacity: 0.5,
  }).addTo(map);

  resultObjects.push(departureCircle, arrivalCircle);

  let i = 0;
  let amount = 4;
  const q = {
    roadNetworkOnly: roadNetworkOnly,
    from: query[0],
    to: query[1],
    minimumDepartureTime: new Date(),
    maximumTransferDuration: PlannerJS.Units.fromMinutes(30), // 30 minutes
    minimumWalkingSpeed: 3
  };

  planner
    .query(q)
    .take(amount)
    .on("error", (error) => {
      console.error(error);
    })
    .on("data", async path => {
      const completePath = await planner.completePath(path);
      console.log('Path', completePath);
      i++;
      const color = getRandomColor();
      addResultPanel(q, completePath, color);
      addResultToMap(q, completePath, color);

    })
    .on("end", () => {
      document.getElementById('loading').style.display = 'none';
      if (i < amount) {
        const noMore = document.createElement("div");
        noMore.className = "path";
        noMore.style.padding = "10px";
        noMore.innerHTML = "No more results";

        results.appendChild(noMore);
      }
    });
}
