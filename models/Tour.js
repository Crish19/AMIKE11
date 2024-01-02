const mongoose = require("mongoose");

const itineraryPointSchema = new mongoose.Schema({
  title: String,
  description: String,
});

const languageTimeSlotSchema = new mongoose.Schema({
  language: String,
  startTime: String, 
  lockStatusByDate: {
    type: Map,
    of: Boolean
  },
});

const tourSchema = new mongoose.Schema({
  name: String,
  overview: String,
  expectations: String,
  images: [String],
  duration: String,
  languagesOffered: [String],
  startDate: Date,
  endDate: Date,
  activeMonths: [Boolean],
  activeDays: [Boolean],
  meetingAddress: String,
  additionalMeetingInfo: String,
  googleMapsLink: String,
  itinerary: [itineraryPointSchema],
  languagesWithTimeSlots: [languageTimeSlotSchema],
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],

});

module.exports = mongoose.model("Tour", tourSchema);
