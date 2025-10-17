const db = require("../models/index");
const Event = db.Event;
const Profile = db.Profile;

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezonePlugin = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezonePlugin);

// 🌍 Master Timezone List (Extended)
const timezoneMap = {
  "UTC": "Etc/UTC",

  // US & Canada
  "Eastern Time (US & Canada)": "America/New_York",
  "Central Time (US & Canada)": "America/Chicago",
  "Mountain Time (US & Canada)": "America/Denver",
  "Pacific Time (US & Canada)": "America/Los_Angeles",
  "Alaska Time": "America/Anchorage",
  "Hawaii Time": "Pacific/Honolulu",

  // Latin America
  "Mexico City": "America/Mexico_City",
  "Bogotá": "America/Bogota",
  "Buenos Aires": "America/Argentina/Buenos_Aires",
  "Santiago": "America/Santiago",
  "São Paulo": "America/Sao_Paulo",

  // Europe
  "London (GMT/BST)": "Europe/London",
  "Paris / Berlin / Rome (CET/CEST)": "Europe/Paris",
  "Istanbul": "Europe/Istanbul",
  "Moscow": "Europe/Moscow",
  "Athens": "Europe/Athens",
  "Warsaw": "Europe/Warsaw",

  // Africa
  "Cairo": "Africa/Cairo",
  "Johannesburg": "Africa/Johannesburg",
  "Nairobi": "Africa/Nairobi",
  "Lagos": "Africa/Lagos",

  // Middle East & Asia
  "Dubai": "Asia/Dubai",
  "Tehran": "Asia/Tehran",
  "Karachi": "Asia/Karachi",
  "Kathmandu": "Asia/Kathmandu",
  "India Standard Time (IST)": "Asia/Kolkata",
  "Dhaka": "Asia/Dhaka",
  "Bangkok": "Asia/Bangkok",
  "Hong Kong": "Asia/Hong_Kong",
  "Tokyo": "Asia/Tokyo",
  "Seoul": "Asia/Seoul",
  "Jakarta": "Asia/Jakarta",

  // Australia & Oceania
  "Sydney": "Australia/Sydney",
  "Melbourne": "Australia/Melbourne",
  "Brisbane": "Australia/Brisbane",
  "Adelaide": "Australia/Adelaide",
  "Perth": "Australia/Perth",
  "Auckland": "Pacific/Auckland",
  "Fiji": "Pacific/Fiji",
};

// ✅ CREATE EVENT
exports.createEvent = async (req, res) => {
  try {
    const { profiles, timezone, startDateTime, endDateTime } = req.body;

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({ message: "Profiles are required." });
    }

    // ✅ Validate timezone
    const tz = timezoneMap[timezone];
    if (!tz) {
      return res.status(400).json({ message: "Invalid timezone selected." });
    }

    // ✅ Parse with dayjs + timezone
    const start = dayjs.tz(startDateTime, tz).toDate();
    const end = dayjs.tz(endDateTime, tz).toDate();

    if (end <= start) {
      return res
        .status(400)
        .json({ message: "End date/time must be after start date/time." });
    }

    const event = new Event({
      profiles,
      timezone,
      startDateTime: start,
      endDateTime: end,
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error("❌ Error creating event:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET ALL EVENTS
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("profiles");
    res.json(events);
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE EVENT (with logs)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      startDateTime,
      endDateTime,
      timezone,
      addProfiles,
      removeProfiles,
      profileId,
    } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const logs = [];

    // ✅ Update start time
    if (startDateTime && new Date(startDateTime).getTime() !== event.startDateTime.getTime()) {
      logs.push({
        profile: profileId,
        action: `Updated start date/time from ${event.startDateTime.toISOString()} → ${new Date(startDateTime).toISOString()}`,
      });
      event.startDateTime = new Date(startDateTime);
    }

    // ✅ Update end time
    if (endDateTime && new Date(endDateTime).getTime() !== event.endDateTime.getTime()) {
      logs.push({
        profile: profileId,
        action: `Updated end date/time from ${event.endDateTime.toISOString()} → ${new Date(endDateTime).toISOString()}`,
      });
      event.endDateTime = new Date(endDateTime);
    }

    // ✅ Update timezone
    if (timezone && timezone !== event.timezone) {
      const tz = timezoneMap[timezone];
      if (!tz) return res.status(400).json({ message: "Invalid timezone." });
      logs.push({
        profile: profileId,
        action: `Updated timezone from "${event.timezone}" → "${timezone}"`,
      });
      event.timezone = timezone;
    }

    // ✅ Add profiles
    if (addProfiles && addProfiles.length > 0) {
      const newProfiles = addProfiles.filter(
        (pid) => !event.profiles.map(String).includes(pid)
      );

      if (newProfiles.length > 0) {
        event.profiles.push(...newProfiles);
        const addedProfiles = await Profile.find({ _id: { $in: newProfiles } }, "name");
        const addedNames = addedProfiles.map((p) => p.name).join(", ");
        logs.push({
          profile: profileId,
          action: `Added profiles: ${addedNames}`,
        });
      }
    }

    // ✅ Remove profiles
    if (removeProfiles && removeProfiles.length > 0) {
      const removedProfiles = event.profiles.filter((p) =>
        removeProfiles.includes(p.toString())
      );

      if (removedProfiles.length > 0) {
        event.profiles = event.profiles.filter(
          (p) => !removeProfiles.includes(p.toString())
        );

        const removed = await Profile.find({ _id: { $in: removedProfiles } }, "name");
        const removedNames = removed.map((p) => p.name).join(", ");
        logs.push({
          profile: profileId,
          action: `Removed profiles: ${removedNames}`,
        });
      }
    }

    // ✅ Save logs if changes occurred
    if (logs.length > 0) {
      event.logs.push(...logs);
    }

    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate("profiles", "name email")
      .populate("logs.profile", "name email");

    res.json(updatedEvent);
  } catch (error) {
    console.error("❌ Error updating event:", error);
    res.status(500).json({ message: "Error updating event" });
  }
};

// ✅ GET EVENT LOGS
exports.getEventLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate("logs.profile", "name");
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json(event.logs || []);
  } catch (error) {
    console.error("❌ Error fetching logs:", error);
    res.status(500).json({ message: error.message });
  }
};
