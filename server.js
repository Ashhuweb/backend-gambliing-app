const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const { PassThrough } = require("stream");
const fs = require("fs");
const path = require("path");
const sportsApi = require("./controller/sportsapi/sportsapi");
const authApi = require("./controller/auth/auth");
const profileApi = require("./controller/profile/profile");
const betApi = require("./controller/bets/bet");
const adminApi = require("./controller/admin/admin");
const Poster = require("./models/posterModel");
const User = require("./models/userModel");
const multer = require("multer");
const depositRequest = require("./controller/paymentRequest'/depositRequest");
const userPaymentMethod = require("./controller/paymentRequest'/userPaymentMethod");
const withdrawRequest = require("./controller/paymentRequest'/withdrawRequest");
const getRequests = require("./controller/paymentRequest'/getRequest");

// Use the environment variable for the port or default to 5000
const port = process.env.PORT || 5000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, "transaction" + Date.now() + path.extname(file.originalname));
  },
});
const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "adminQR/");
  },
  filename: (req, file, cb) => {
    cb(null, "QR" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
const uploadQR = multer({ storage: storage2 });

// Define a middleware function to check the request origin
const allowSpecificOrigin = (req, res, next) => {
  const allowedOrigin = "https://7x24exch.com"; // Change this to your specific origin
  //https://7x24exch.com
  // http://localhost:3000
  // Check if the request's origin header matches the allowed origin
  const requestOrigin = req.headers.origin;
  // console.log(req.headers);
  // console.log(requestOrigin);
  if (requestOrigin && requestOrigin === allowedOrigin) {
    // If it matches, set the appropriate headers to allow CORS and proceed
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
  } else {
    // If it doesn't match, send a 403 Forbidden response
    res.status(403).send("Forbidden");
  }
};

var whitelist = [
  "http://localhost:3000",
  "https://x724bets.web.app",
  "https://7x24exch.com",
];
// Configure CORS middleware with credentials support
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Enable credentials support
};
// Enable CORS for all routes
app.use(cors(corsOptions));
app.use(express.static("public"));
app.use(express.static("uploads"));
app.use(express.static("adminQR"));
// app.use(logger);

// Define a route for the root URL
app.get("/", (req, res) => {
  res.send("Hello, we are up and running!");
});

// Define a route to proxy and stream the image
app.get("/proxy-image", async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send("Image URL parameter is missing");
  }

  try {
    // Make a GET request to the image URL
    const response = await axios.get(imageUrl, { responseType: "stream" });

    // Set the appropriate headers for the image
    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Content-Disposition", `inline; filename=image.jpg`);

    // Stream the image directly to the response
    const stream = new PassThrough();
    response.data.pipe(stream);
    stream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error while fetching or streaming the image");
  }
});

// Route to get all posters
app.get("/get-posters", async (req, res) => {
  try {
    // Retrieve all poster URLs from MongoDB
    const posters = await Poster.find();

    res.status(200).json({
      error: false,
      message: "Posters retrieved successfully",
      posters,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});
app.get("/get-whatsapp", async (req, res) => {
  try {
    // Retrieve all poster URLs from MongoDB
    const user = await User.findOne({ username: "admin" });

    res.status(200).json({
      error: false,
      message: "Posters retrieved successfully",
      number: user.mobile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});

// Start the server and listen on the specified port
// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://rb0900426:ksPdteivNbr1a0vU@cluster0.yynwulh.mongodb.net/?retryWrites=true&w=majority"
);

// Check for MongoDB connection success or failure
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// parser
app.use(express.json());
app.use(cookieParser());
//routes
app.use("/sports", allowSpecificOrigin, sportsApi);
app.use("/auth", allowSpecificOrigin, authApi);
app.use("/profile", allowSpecificOrigin, profileApi);
app.use("/bet", allowSpecificOrigin, betApi);
app.use("/admin", allowSpecificOrigin, adminApi);
app.use("/userPaymentMethod", userPaymentMethod);
app.use("/withdrawRequest", withdrawRequest);
app.use("/getRequests", getRequests);
app.use("/depositRequest", upload.single("screenShot"), depositRequest);
app.use(
  "/paymentMethod",
  uploadQR.single("UPI_QR"),
  require("./controller/paymentRequest'/addPaymentMethod")
);
app.use(
  "/casino",
  allowSpecificOrigin,
  require("./controller/sportsapi/casinoapi")
);
