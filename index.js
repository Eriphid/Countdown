const express = require("express");
const path    = require("path");

const app = express();

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/fonts", express.static(path.join(__dirname, "fonts")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/audio", express.static(path.join(__dirname, "audio")));
app.use("/videos", express.static(path.join(__dirname, "videos")));

app.listen(process.env.PORT || 8080);
