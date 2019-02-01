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

const planner = new Planner();

planner.prefetchStops();
planner.prefetchConnections();

let plannerResult;
const resetButton = document.querySelector("#reset");
const results = document.querySelector("#results");
const prefetchWrapper = document.querySelector("#prefetch");
const prefetchBar = document.querySelector("#prefetch-bar");

let lines = [];
let polyLines = [];
let resultObjects = [];
let query = [];
let allStops = [];
let prefetchViews = [];

let firstPrefetch;

const removeLines = () => {
  for (const line of polyLines) {
    line.remove();
  }

  lines = [];
  polyLines = [];
  lines = [];
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

resetButton.onclick = e => {
  removeLines();
  removeResultObjects();
  query = [];
  results.innerHTML = "";

  for (const stop of allStops) {
    stop.addTo(map);
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
    if (stop["http://semweb.mmlab.be/ns/stoptimes#avgStopTimes"] > 100) {
      const marker = L.marker([stop.latitude, stop.longitude]).addTo(map);

      marker.bindPopup(stop.name);

      allStops.push(marker);

      marker.on("click", e => {
        selectRoute(e, stop.id);
      });
    }
  }
});

planner
  .on("query", query => {
    console.log("Query", query);
  })
  .on("sub-query", query => {
    const { minimumDepartureTime, maximumArrivalTime, maximumTravelDuration } = query;

    console.log(
      "[Subquery]",
      minimumDepartureTime,
      maximumArrivalTime,
      maximumArrivalTime - minimumDepartureTime,
      maximumTravelDuration / 1, 66667e-5
    );

    removeLines();
  })
  .on("initial-reachable-stops", reachableStops => {
    console.log("initial", reachableStops);
    reachableStops.map(({ stop }) => {
      const startMarker = L.marker([stop.latitude, stop.longitude]).addTo(map);

      startMarker.bindPopup("initialreachable: " + stop.name);

      resultObjects.push(startMarker);
    });
  })
  .on("final-reachable-stops", reachableStops => {
    console.log("final", reachableStops);

    reachableStops.map(({ stop }) => {
      const startMarker = L.marker([stop.latitude, stop.longitude]).addTo(map);

      startMarker.bindPopup("finalreachable: " + stop.name);

      resultObjects.push(startMarker);
    });
  })
  .on("added-new-transfer-profile", ({ departureStop, arrivalStop, amountOfTransfers }) => {

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
    }
  )
  .on("connection-prefetch", (departureTime) => {
    if (!firstPrefetch) {
      firstPrefetch = departureTime;

      prefetchBar.innerHTML = departureTime.toLocaleTimeString();

    } else {
      const width = getPrefetchViewWidth(firstPrefetch, departureTime);

      prefetchBar.style.width = `${width}px`;
      prefetchBar.setAttribute("data-last", departureTime.toLocaleTimeString());
    }
  })
  .on("connection-iterator-view", (lowerBound, upperBound, completed) => {
    if (!lowerBound || !upperBound) {
      return;
    }

    if (!completed) {
      const width = getPrefetchViewWidth(lowerBound, upperBound);
      const offset = getPrefetchViewWidth(firstPrefetch, lowerBound);

      const prefetchView = document.createElement("div");
      prefetchView.className = "prefetch-view";
      prefetchView.style.marginLeft = `${offset}px`;
      prefetchView.style.width = `${width}px`;
      prefetchView.style.backgroundColor = "red";

      prefetchWrapper.appendChild(prefetchView);
      prefetchViews.push({ lowerBound, upperBound, elem: prefetchView });

    } else {
      const { elem } = prefetchViews
        .find((view) => view.lowerBound === lowerBound && view.upperBound === upperBound);

      if (!elem) {
        console.warn("Wut");
        return;
      }

      elem.style.backgroundColor = "limegreen";
    }

  });

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

map.on("click", onMapClick);

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function runQuery(query) {
  console.log(query);

  const maximumWalkingDistance = 200;

  const departureCircle = L.circle([query[0].latitude, query[0].longitude], {
    color: "limegreen",
    fillColor: "limegreen",
    fillOpacity: 0.5,
    radius: maximumWalkingDistance
  }).addTo(map);

  const arrivalCircle = L.circle([query[1].latitude, query[1].longitude], {
    color: "red",
    fillColor: "red",
    fillOpacity: 0.5,
    radius: maximumWalkingDistance
  }).addTo(map);

  resultObjects.push(departureCircle, arrivalCircle);

  planner
    .query({
      publicTransportOnly: true,
      from: query[0], // Brussels North
      to: query[1], // Ghent-Sint-Pieters
      minimumDepartureTime: new Date(),
      maximumWalkingDistance,
      maximumTransferDuration: 30 * 60 * 1000, // 30 minutes
      minimumWalkingSpeed: 3
    })
    .then(publicTransportResult => {
      plannerResult = publicTransportResult;

      let i = 0;
      let amount = 4;

      publicTransportResult.take(amount)
        .on("data", path => {
          console.log("path", i, path);
          i++;

          const color = getRandomColor();

          const pathElement = document.createElement("div");
          pathElement.className = "path";

          path.steps.forEach(step => {
            const stepElement = document.createElement("div");
            stepElement.className = "step";

            const travelMode = document.createElement("div");
            travelMode.className = "travelMode " + step.travelMode;
            stepElement.appendChild(travelMode);

            const details = document.createElement("div");
            details.className = "details";
            stepElement.appendChild(details);

            const startLocation = document.createElement("div");
            startLocation.className = "startLocation";
            startLocation.innerHTML =
              "Start location: " + step.startLocation.name;
            details.appendChild(startLocation);

            if (step.startTime) {
              const startTime = document.createElement("div");
              startTime.className = "startTime";
              startTime.innerHTML = step.startTime;
              details.appendChild(startTime);
            }

            if (step.enterConnectionId) {
              const enterConnectionId = document.createElement("div");
              enterConnectionId.className = "enterConnectionId";
              enterConnectionId.innerHTML =
                "Enter connection: " + step.enterConnectionId;
              details.appendChild(enterConnectionId);
            }

            if (step.duration) {
              const duration = document.createElement("div");
              duration.className = "duration";
              duration.innerHTML =
                "Duration: minimum " +
                step.duration.minimum / (60 * 1000) +
                "min";
              details.appendChild(duration);
            }

            const stopLocation = document.createElement("div");
            stopLocation.className = "stopLocation";
            stopLocation.innerHTML = "Stop location: " + step.stopLocation.name;
            details.appendChild(stopLocation);

            if (step.stopTime) {
              const stopTime = document.createElement("div");
              stopTime.className = "stopTime";
              stopTime.innerHTML = step.stopTime;
              details.appendChild(stopTime);
            }

            if (step.exitConnectionId) {
              const exitConnectionId = document.createElement("div");
              exitConnectionId.className = "exitConnectionId";
              exitConnectionId.innerHTML =
                "Exit connection: " + step.exitConnectionId;
              details.appendChild(exitConnectionId);
            }

            pathElement.style.borderLeft = "5px solid " + color;

            pathElement.appendChild(stepElement);
          });

          results.appendChild(pathElement);

          path.steps.forEach(step => {
            const { startLocation, stopLocation, travelMode } = step;

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
            const line = [
              [startLocation.latitude, startLocation.longitude],
              [stopLocation.latitude, stopLocation.longitude]
            ];

            const polyline = new L.Polyline(line, {
              color,
              weight: 5,
              smoothFactor: 1,
              opacity: 0.7,
              dashArray: travelMode === "walking" ? "8 8" : null
            }).addTo(map);

            resultObjects.push(startMarker, stopMarker, polyline);
          });
        })
        .on("end", () => {
          if (i < amount) {
            const noMore = document.createElement("div");
            noMore.className = "path";
            noMore.style.padding = "10px";
            noMore.innerHTML = "No more results";

            results.appendChild(noMore);
          }
        });
    })
    .catch((error) => {
      console.error(error);
    });
}
