const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageTimeSlot', required: true },
  status: { type: String, default: 'confirmed' },
}, { timestamps: true }); 

module.exports = mongoose.model('Booking', bookingSchema);
