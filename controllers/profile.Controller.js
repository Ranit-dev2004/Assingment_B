const db = require("../models/index");
const Profile = db.Profile;

exports.createProfile = async (req, res) => {
  try {
    const { name, timezone } = req.body;
    const profile = new Profile({ name, timezone });
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
