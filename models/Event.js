const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  profile: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" }, // Reference to the profile who made the change
  name: String, // Store name directly for convenience and log stability
  action: { type: String, required: true }, // The human-readable action string
  timestamp: { type: Date, default: Date.now },
});

const eventSchema = new mongoose.Schema(
  {
    profiles: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    ],
    timezone: { type: String, required: true },
    logs: { type: [logSchema], default: [] }, // Array to hold the change history
    startDateTime: { type: Date, required: true },
    endDateTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startDateTime;
        },
        message: "End date/time must be after start date/time.",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);