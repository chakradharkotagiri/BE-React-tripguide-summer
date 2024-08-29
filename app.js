const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const fs = require("fs");
const dotEnv = require('dotenv')
dotEnv.config()
const path = require("path");
const placesRoutes = require("./routes/place-route");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const DB_USER = "chakradhar";
const DB_PASSWORD = "Chakri5643";
const DB_NAME = "PLACESAPP";

const app = express();

app.use(bodyParser.json());
app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use(morgan("tiny"));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://tripguide-mern.netlify.app");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    if (req.method === 'OPTIONS') {
        console.log("returning");
      return res.sendStatus(200);
    }
    next();
  });

app.use(cors());

app.use("/api/users", usersRoutes);
app.use("/api/places", placesRoutes);

// Handle unsupported routes

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log("error", err);
    });
  }
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

// Connect to MongoDB
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b2huysv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Connected to the database!");
    app.listen(5001, () => {
      console.log("Server is running on port 5001");
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database", err);
  });
