const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  time: String,
  languages: [String],
  isOpen: Boolean,
});


const tourDateSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour'
  },
  activeMonths: [Boolean], // Array of booleans indicating active months
  activeDays: [Boolean], // Array of booleans indicating active days
  languageTimeSlots: {
    type: Map,
    of: [timeSlotSchema] // Map of languages to their respective time slots
  }
});


const TourDate = mongoose.model('TourDate', tourDateSchema);
module.exports = TourDate;
