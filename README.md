# Planner.js: A JS library for route planning

🛸 [![Build Status](https://travis-ci.org/openplannerteam/planner.js.svg?branch=dev)](https://travis-ci.org/openplannerteam/planner.js) 🚴‍♂️ [![MIT License](https://img.shields.io/github/license/openplannerteam/planner.js.svg?maxAge=2592000)](https://github.com/openplannerteam/planner.js/blob/master/LICENSE) 🚉

Current status: _to be launched in February_ 🚀

For now: clone the repository, run `npm install` and `npm build`. Afterwards you can use it as follows:

Include it in the browser:
```html
<script src="https://openplannerteam.github.io/planner.js/js/planner-latest.js"></script>
```

Include it in your JavaScript project:
```javascript
// Not yet published on NPM...
const Planner = require('plannerjs').default;
```

Use it in both environments:
```javascript
const planner = new Planner();
planner.query({
  publicTransportOnly: true,
  from: "http://irail.be/stations/NMBS/008812005", // Brussels North
  to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
  minimumDepartureTime: new Date(),
  maximumWalkingDistance: 200, // 200 meters
  maximumTransferDuration: 30 * 60 * 1000, // 30 minutes
  minimumWalkingSpeed: 3 // 3 km/h
})
  .take(3)
  .on('data', (path) => {
   console.log(path);
  })
  .on('end', () => {
    console.log('No more paths!')
  })
  .on('error', (error) => {
    console.log(error);
  });
```

## Documentation

For further instructions, follow the documentation at https://openplannerteam.github.io/planner.js/

## Developing

 * Building the docs with typedoc: `npm run doc`
 * Testing with jest: `npm test`
 * Build a new browser version with `npm run browser`
