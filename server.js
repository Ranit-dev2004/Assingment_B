const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const axios = require('axios');
require("dotenv").config();

const app = express();

// ✅ CORS setup
app.use(cors({
  origin: "https://eventassingment.vercel.app", // <-- your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // allows cookies/session
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "Razil-session",
    keys: ["COOKIE_SECRET"],
    httpOnly: true,
  })
);

const db = require("./models/index.js");

db.mongoose
  .connect(`mongodb+srv://welcometodattatreya_db_user:Ranit%402004@aifincheak.iel2amg.mongodb.net/`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.error("Cannot connect to the database!", err);
    process.exit();
  });

app.get("/", (req, res) => {
  res.json({ message: "Welcome to web service is Running." });
});

// ✅ Routers
const eventRoutes = require("./routes/Event.Routes");
const profileRoutes = require("./routes/Profile.Routes");

app.use("/api/events", eventRoutes);
app.use("/api/profiles", profileRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
