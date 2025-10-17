const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/sprites",
  express.static(path.join(__dirname, "public/sprites"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".json")) {
        res.setHeader("Content-Type", "application/json");
      } else if (filePath.endsWith(".png")) {
        res.setHeader("Content-Type", "image/png");
      }
      // res.setHeader("Access-Control-Allow-Origin", "*"); // enable CORS
    },
  })
);

// Path to your tiles folder
const tilesDir = path.join(__dirname, "public/tiles");

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/tiles/:z/:x/:y.pbf", (req, res) => {
  const { z, x, y } = req.params;

  // Construct file path
  const filePath = path.join(tilesDir, z, x, `${y}.pbf`);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send("Tile not found");
      return;
    }

    // Set correct content type for vector tiles
    res.setHeader("Content-Type", "application/x-protobuf");
    res.setHeader("Content-Encoding", "gzip");

    // Stream the pbf file
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

app.get("/fonts/:fontstack/:range.pbf", (req, res) => {
  const { fontstack, range } = req.params;
  const safeFontstack = fontstack.replace(/[^a-zA-Z0-9_\-, ]/g, "");
  const safeRange = range.replace(/[^0-9\-]/g, "");

  const fontPath = path.join(
    __dirname,
    "public/fonts",
    safeFontstack,
    `${safeRange}.pbf`
  );

  res.setHeader("Content-Type", "application/x-protobuf");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  res.sendFile(fontPath, (err) => {
    if (err) {
      console.error("Font PBF not found:", fontPath);
      res.status(err.status || 404).send("Font glyph not found");
    }
  });
});

app.get("/site/:id", (req, res) => {
  const { id } = req.params;
  res.setHeader("Content-Type", "application/json");
  res.send({ id: id });
});

app.get("/sitex/geojson", (req, res) => {
  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [51.4878798, 35.7781818],
        },
        properties: {
          name: "مرکز لویزان",
        },
      },
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [50.9789704, 35.8250757],
        },
        properties: {
          name: "مرکز بهشتی",
        },
      },
    ],
  };

  res.setHeader("Content-Type", "application/json");
  res.send(geojson);
});

app.listen(PORT, () => {
  console.log(`Vector tile server listening on http://localhost:${PORT}`);
});

// ./tilemaker --input tehran.osm.pbf --output tiles/ --config ./resources/config-openmaptiles.json --process ./resources/process-openmaptiles.lua
// config.json : remove shapefiles and change "compress": "none",

// https://api.maptiler.com/maps/openstreetmap/sprite.json
// https://api.maptiler.com/maps/openstreetmap/sprite.png

// debug
/*
map.on('idle', () => {
  const features = map.queryRenderedFeatures();
  console.log("Rendered features count:", features.length);
  console.log(features.map(f => f.properties));
});

 label : name:latin
 
https://maplibre.org/maputnik/?layer=2008948339%7E0#0.8/0/0

Oneway path layer
  remove : , ["==", "class", "path"] only oneway = 1

 numbers in rectangles are roads ref
 // in primary trunk secondary .... set visibility : none
 
*/
