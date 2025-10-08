const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

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

  fs.readFile(fontPath, (err, data) => {
    if (err) {
      console.error("Font PBF not found:", fontPath);
      return res.status(404).send("Font glyph not found");
    }
    res.setHeader("Content-Type", "application/x-protobuf");
    res.send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Vector tile server listening on http://localhost:${PORT}`);
});
