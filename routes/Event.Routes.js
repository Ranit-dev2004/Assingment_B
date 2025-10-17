const express = require("express");
const {
  createEvent,
  getEvents,
  updateEvent,
  getEventLogs
} = require("../controllers/Event.Controller");

const router = express.Router();

router.post("/", createEvent);
router.get("/", getEvents);
router.put("/:id", updateEvent);
router.get("/:id/logs", getEventLogs);

module.exports = router;
