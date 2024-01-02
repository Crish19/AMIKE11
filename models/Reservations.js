const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    name: String,
    email: String,
    phone: String,
  },
  tour: {
    name: String,
    date: Date,
    time: String,
    languages: [String],
    travelers: Number,
  },
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
