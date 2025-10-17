const express = require("express");
const {
  createProfile,
  getProfiles,
} = require("../controllers/profile.Controller");

const router = express.Router();

router.post("/", createProfile);
router.get("/", getProfiles);

module.exports = router;
