// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Reservation = require('../models/Reservation');


// Create a new booking -associated- reservation
router.post('/', async (req, res)=>{
  try{
    const { ReservationId, name, email, phone} = req.body;

    //check reservation with ID exists
    const reservation = await Reservation.findById(ReservationId);
    if (!reservation){
      return res.status(404).json({error: 'Reservation not Found'})
    }

    //Creates new booking associated with the reservation
    const booking = new Booking({
      name,
      email,
      phone,
      reservation: reservation._id, // link the booking to the reservation
    });
    await booking.save();
    res.status(201).json(booking);
  } catch (error){
    res.status(500).json({error: 'Could not create booking'})
  }
});

module.exports = router; 

