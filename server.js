const mongoose = require("mongoose");
const express = require("express");
const Reservation = require("./models/Reservations");
const Booking = require("./models/Booking");
const cors = require("cors");
const nodemailer = require("nodemailer");
const Tour = require("./models/Tour");
const Discount = require("./models/Discount");
const multer = require("multer");
const path = require("path");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/auth");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
const corsOptions = {
  origin: '*',  // Cambia esto a tu dominio de producción
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(
  "/public/uploads",
  express.static(path.join(__dirname, "public/uploads"))
);

require("dotenv").config();

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
 
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB!");
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "amiketours@gmail.com",
    pass: "umzf wekx uaxk frkx",
  },
});

//Multer
//set storage
const storage = multer.diskStorage({
  destination: "./public/uploads",
  filename: function (req, file, cd) {
    cd(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: "" }, // Limit file size (example: 1MB)
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).array("tourImages", 5); // 'tourImages' is the field name in the form, 5 is the max number of files

const discountImageUpload = multer({
  storage: storage,
  limits: { fileSize: "" }, // Example limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("images");

// Check file type
function checkFileType(file, cb) {
  if (!file || !file.originalname) {
    return cb(new Error("No file provided"));
  }
  console.log("Uploading file:", file.originalname, "Type:", file.mimetype);

  // Allowed file types
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// Define API routes

// Get all discounts
app.get("/api/discounts", async (req, res) => {
  try {
    const discounts = await Discount.find();
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new discount
app.post("/api/discounts", discountImageUpload, async (req, res) => {
  const discount = new Discount({
    name: req.body.name,
    description: req.body.description,
    imageUrl: req.file ? req.file.path : null,
    websiteUrl: req.body.websiteUrl,
    location: req.body.location,
  });

  try {
    const newDiscount = await discount.save();
    res.status(201).json(newDiscount);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a discount
app.put("/api/discounts/:id", discountImageUpload, async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) return res.status(404).send("Discount not found");

    // Update fields from the request body
    if (req.body.name) discount.name = req.body.name;
    if (req.body.description) discount.description = req.body.description;
    if (req.body.websiteUrl) discount.websiteUrl = req.body.websiteUrl;
    if (req.body.location) discount.location = req.body.location;

    // Update image if a new one is uploaded
    if (req.file) discount.imageUrl = req.file.path;

    const updatedDiscount = await discount.save();
    res.json(updatedDiscount);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a discount
app.delete("/api/discounts/:id", async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) return res.status(404).send("Discount not found");

    await Discount.deleteOne({ _id: req.params.id }); // Corrected line
    res.json({ message: "Deleted Discount" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/tours", async (req, res) => {
  try {
    const tours = await Tour.find();
    res.json(tours);
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ message: error.message });
  }
});

function safeJSONParse(str, defaultValue) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("JSON parsing error:", e);
    return defaultValue;
  }
}

app.post("/api/tours", upload, async (req, res) => {
  try {
    const {
      name,
      overview,
      meetingAddress,
      googleMapsLink,
      additionalMeetingInfo,
      expectations,
      duration,
      languagesOffered,
      startDate, // Add startDate
      endDate,
    } = req.body;

    console.log("Itinerary type:", typeof req.body.itinerary);
console.log("Itinerary before parsing:", req.body.itinerary);

const itinerary = req.body.itinerary
? JSON.parse(req.body.itinerary)
: undefined;


    const activeMonths = safeJSONParse(
      req.body.activeMonths[1],
      new Array(12).fill(false)
    );
    const activeDays = safeJSONParse(
      req.body.activeDays[1],
      new Array(7).fill(false)
    );

    const languagesWithTimeSlots = safeJSONParse(
      req.body.languagesWithTimeSlots,
      []
    );
    console.log("Parsed activeMonths:", activeMonths);
    console.log("Parsed activeDays:", activeDays);

    const imagePaths = req.files.map((file) => file.path);

    const newTour = new Tour({
      name,
      overview,
      meetingAddress,
      googleMapsLink,
      additionalMeetingInfo,
      expectations,
      duration,
      languagesOffered,
      languagesWithTimeSlots,
      images: imagePaths,
      activeMonths,
      activeDays,
      startDate, // Add startDate
      endDate,
      itinerary,
    });
    console.log("Received activeMonths:", req.body.activeMonths);

    await newTour.save();
    res.status(201).json(newTour);
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/tours/:id", upload, async (req, res) => {
  const tourId = req.params.id;

  try {
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    const {
      name,
      overview,
      meetingAddress,
      googleMapsLink,
      additionalMeetingInfo,
      expectations,
      duration,
      languagesOffered,
      startDate,
      endDate,
    } = req.body;

    const itinerary = req.body.itinerary
    ? JSON.parse(req.body.itinerary)
    : undefined;

    const activeMonths = req.body.activeMonths && req.body.activeMonths.length > 1
    ? safeJSONParse(req.body.activeMonths[1], new Array(12).fill(false))
    : new Array(12).fill(false);
  
const activeDays = req.body.activeDays && req.body.activeDays.length > 1
    ? safeJSONParse(req.body.activeDays[1], new Array(7).fill(false))
    : new Array(7).fill(false);

const imagePaths =
      req.files && req.files.length > 0 ? req.files.map((file) => file.path) : tour.images;


    const languagesWithTimeSlots = safeJSONParse(
      req.body.languagesWithTimeSlots,
      []
    );

    

    console.log("Parsed activeMonths:", activeMonths);
    console.log("Parsed activeDays:", activeDays);

    

    // Updating the tour with the new data
    Object.assign(tour, {
      name,
      overview,
      meetingAddress,
      googleMapsLink,
      additionalMeetingInfo,
      expectations,
      duration,
      languagesOffered,
      images: imagePaths,
      languagesWithTimeSlots,
      activeMonths,
      activeDays,
      startDate,
      endDate,
      itinerary,
    });

    console.log("Received update for tour:", req.body);

    const updatedTour = await tour.save();
    res.json(updatedTour);
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(400).json({ message: error.message });
  }
});






//lock/unlock functionality
// In your Express.js server

app.put('/api/tours/:tourId/language-session-lock', async (req, res) => {

  const { tourId } = req.params;
  const { language, timeSlot, date, lockStatus } = req.body;

  try {
    // Find the specific tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).send('Tour not found');
    }

    // Find the specific language time slot
    const session = tour.languagesWithTimeSlots.find(slot =>
      slot.language === language && slot.startTime === timeSlot
    );

    if (!session) {
      return res.status(404).send('Language session not found');
    }

    


    // Initialize lockStatusByDate if it doesn't exist
    if (!session.lockStatusByDate) {
      session.lockStatusByDate = new Map();
    }
  
   console.log("Session before update:", session);

    // Update the lock status for the given date
    session.lockStatusByDate.set(date, lockStatus);

    // Debugging: Log the updated session
    console.log("Updated session lock status:", session.lockStatusByDate);
    console.log("Session after update:", session);


    // Mark the modified path for Mongoose
    tour.markModified('languagesWithTimeSlots');

    // Save the updated tour
    await tour.save();

    // Send success response
    res.json({ message: 'Lock status updated successfully' });
  } catch (error) {
    console.error('Error updating lock status:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});











//booking-published-bookings
app.get('/api/tours-with-bookings', async (req, res) => {
  try {
      const toursWithBookings = await Tour.find()
          .populate({
              path: 'bookings',
              populate: { path: 'reservation' }
          })
          .exec();

      res.json(toursWithBookings);
  } catch (error) {
      console.error('Error fetching tours with bookings:', error);
      res.status(500).send('Internal Server Error');
  }
});


// Endpoint to add a booking to a specific tour

app.put('/api/tours/:tourId/add-booking', async (req, res) => {
  const { tourId } = req.params;
  const { bookingId } = req.body;

  try {
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).send('Tour not found');
    }

    // Add the booking ID to the tour's bookings array
    tour.bookings.push(bookingId);
    await tour.save();

    res.status(200).json({ message: 'Booking added to tour successfully' });
  } catch (error) {
    console.error('Error adding booking to tour:', error);
    res.status(500).send('Internal Server Error');
  }
});



    




app.delete("/api/tours/:id", async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      return res.status(404).send("Tour not found");
    }
    res.status(200).json({ message: "Tour deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/reservations/create", async (req, res) => {
  console.log("Received reservation data:", req.body);

  try {
    const { name, email, phone, tourName, date, time, languages, travelers } =
      req.body;

    const reservation = new Reservation({
      user: {
        name,
        email,
        phone,
      },
      tour: {
        name: tourName,
        date,
        time,
        languages,
        travelers,
      },
    });

    await reservation.save();
    res.status(201).json(reservation);
  } catch (error) {
    console.error("Error details: ", error);
    res.status(400).json({ error: error.message, details: error.errors });
  }
});

app.get("/api/reservations/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to handle booking cancellation
app.get("/api/bookings/cancel/:bookingId", async (req, res) => {
  const bookingId = req.params.bookingId;

  try {
    // Find the booking by ID and update its status to 'cancelled'
    const booking = await Booking.findById(bookingId).populate("reservation");
    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    const tourDate = new Date(booking.reservation.tour.date);
    const formattedTourDate = tourDate.toLocaleDateString("en-US", {
      timeZone: "Europe/Stockholm",
    });

    // Update booking status to 'cancelled'
    booking.status = "cancelled";
    await booking.save();

    // Send cancellation email to user
    const cancellationEmailTemplate = `
    <html>
    <body>
        <h3>Your Booking Cancellation</h3>
        <p>Dear ${booking.name},</p>
        <p>Your booking for the "${booking.reservation.tour.name}" on ${formattedTourDate} has been successfully cancelled.</p>
        <p>If this was a mistake or you need further assistance, please contact us immediately:</p>
        <ul>
            <li>Email: amiketours@gmail.com</li>
            <li>Phone: +46761426946 or +46729406310</li>
            <li>Website: <a href="http://www.amiketours.com">www.amiketours.com</a></li>
        </ul>
        <p>Best regards,</p>
        <p>Amike Tours Team</p>
    </body>
</html>`;

    const userMailOptions = {
      from: "amiketours@gmail.com",
      to: booking.email,
      subject: "Your Booking Cancellation",
      html: cancellationEmailTemplate,
    };

    await transporter.sendMail(userMailOptions);

    // Send notification email to admin
    const adminNotificationTemplate = `
    <html>
    <body>
        <h3>Booking Cancellation Alert</h3>
        <p>A booking has been cancelled:</p>
        <ul>
            <li>Name: ${booking.name}</li>
            <li>Email: ${booking.email}</li>
            <li>Phone: ${booking.phone}</li>
            <li>Tour: ${booking.reservation.tour.name}</li>
            <li>Date: ${formattedTourDate}</li>
            <li>Booking ID: ${booking._id}</li>
        </ul>
        <p>Please check the booking system for more details.</p>
    </body>
</html>`;

    const adminMailOptions = {
      from: "amiketours@gmail.com",
      to: "amiketours@gmail.com",
      subject: "Booking Cancellation Notification",
      html: adminNotificationTemplate,
    };

    await transporter.sendMail(adminMailOptions);

    // Redirect to a confirmation page
    res.redirect("https://amiketours.com/booking-cancelled-confirmation");
  } catch (error) {
    console.error("Cancellation error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    console.log("Booking request received:", req.body);

    const { name, email, phone, reservationId,slotId } = req.body;
    if (!name || !email || !phone || !reservationId || !slotId) {
      console.error("Invalid booking request:", req.body);
      return res
        .status(400)
        .json({ error: "Invalid booking request. Missing required fields." });
    }

    console.log("Creating new booking instance");

    const booking = new Booking({
      name,
      email,
      phone,
      reservation: reservationId,
      slotId,
    });

    // Save the booking first
    console.log("Saving booking to database");
    const bookingSaveStartTime = Date.now();

    await booking.save();
    console.log("Booking saved. Time taken:", Date.now() - bookingSaveStartTime, "ms");

    console.log("Populating booking with reservation details");

    await booking.populate("reservation");
    console.log("Tour Details:", booking.reservation.tour);
    console.log("Booking populated with reservation details");


    // Find the corresponding tour and update it
    const tour = await Tour.findById(booking.reservation.tour._id);
    if (tour) {
      tour.bookings.push(booking._id);
      await tour.save();
    }

    const bookingDetails = booking.toJSON();
    const tourDetails = bookingDetails.reservation.tour;

    const tourDate = new Date(tourDetails.date);
    const formattedDate = tourDate.toLocaleDateString("en-US", {
      timeZone: "Europe/Stockholm",
    });

    const htmlTemplate = `
    <html>
    <head>
        <title>Booking Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #f9590f ; padding: 10px; }
            .logo-container { display: flex; align-items: center; justify-content: center; }
            .logo-text { font-size: 24px; color: white; font-weight: bold; margin-left: 5px; }
            .content { padding: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { background-color: #f9590f ; color: white; padding: 20px; font-size: 14px; text-align: center; }
            .social-icons img { width: 30px; height: 30px; margin: 0 10px; }
            .cancel-btn { background-color: #FF0000; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 20px; }
    
            /* Responsive styles */
            @media screen and (min-width: 768px) {
                .header, .footer { text-align: left; }
                .logo-container { justify-content: flex-start; }
                .logo-text { font-size: 50px;}
            }
        </style>
    </head>
    <body>
        <header class="header">
            <div class="logo-container">
                <img src="https://i.imgur.com/1UyXA5R.png" alt="Your Logo" width="150">
                <span class="logo-text">AMIKE TOURS</span>
            </div>
        </header>
    
        <div class="content">
            <p>Hi ${bookingDetails.name},</p>
            <p>Thank you for booking with Amike Tours! We are excited to take you on an adventure you won't forget. Here are your tour details:</p>
    
            <table>
                <tr><th>Booking Reference:</th><td>${
                  bookingDetails._id
                }</td></tr>
                <tr><th>Tour Name:</th><td>${tourDetails.name}</td></tr>
                <tr><th>Date:</th><td>${formattedDate}</td></tr>
                <tr><th>Time:</th><td>${tourDetails.time}</td></tr>
                <tr><th>Number of Travelers:</th><td>${
                  tourDetails.travelers
                }</td></tr>
                <tr><th>Languages:</th><td>${tourDetails.languages.join(
                  ", "
                )}</td></tr>
            </table>
    
            <h3>Meeting Point:</h3>
<p>
    <a href="https://www.google.com/maps/place/Drottninggatan+2,+111+51+Stockholm,+Sweden" target="_blank">
        Drottninggatan 2, 111 51 Stockholm, Sweden
    </a>
</p>
    
            <h3>Preparation Tips:</h3>
            <ul>
                <li>Sweden is a nearly cashless society. Digital payments are widely accepted, so exchanging money is typically unnecessary.</li>
                <li>Please arrive at the meeting point, just in front of the Swedish Parliament and before crossing the bridge, about 5 minutes early.</li>
            </ul>


            <p>If you need to cancel your booking, please click the button below or contact us directly.</p>
            <!-- Cancel Booking Button -->
            <a href="https://amiketours.com/api/bookings/cancel/${
              bookingDetails._id
            }" style="color: white; background-color: red; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 20px;">Cancel Booking</a>
          
    
            <p>Best regards,</p>
            <p>Amike Tours Team</p>
        </div>
    
        <footer class="footer">
            <div class="social-icons">
                <a href="https://instagram.com/amiketours">
                    <img src="https://i.imgur.com/uVwZqGC.png" alt="Instagram">
                </a>
                <a href="https://api.whatsapp.com/send?phone=46729406310">
                    <img src="https://i.imgur.com/kPt60p1.png" alt="WhatsApp">
                </a>
            </div>
            <p>Contact us at amiketours@gmail.com</p>
        </footer>
    </body>
    </html>

`;

    // Attempt to send emails
    try {
      // Send confirmation email to the user
      const userMailOptions = {
        from: "amiketours@gmail.com",
        to: bookingDetails.email,
        subject: "Booking Confirmation",
        html: htmlTemplate,
      };
      console.log("Sending confirmation email to user");

      await transporter.sendMail(userMailOptions);
      console.log("Confirmation email sent to user");
      

      const bookingCreationDate = new Date(booking.createdAt).toLocaleString(); // Formats the date and time in a readable format

      // Send notification email to your email
      const adminMailOptions = {
        from: "amiketours@gmail.com",
        to: "amiketours@gmail.com", // Replace with your actual email
        subject: "New Booking",
        html: `
        <p>New booking received:</p>
        <p>Name: ${bookingDetails.name}</p>
        <p>Email: ${bookingDetails.email}</p>
        <p>Phone: ${bookingDetails.phone}</p>
        <p>Booking ID: ${bookingDetails._id}</p>
        <p>Tour: ${tourDetails.name}</p>
        <p>Booking Date: ${bookingCreationDate}</p>
        <p>Tour Date: ${formattedDate}</p>
        <p>Time: ${tourDetails.time}</p>
        <p>Languages: ${tourDetails.languages.join(", ")}</p>
        <p>Travelers: ${tourDetails.travelers}</p>
      `,
      };
      console.log("Sending notification email to admin");

      await transporter.sendMail(adminMailOptions);
      console.log("Notification email sent to admin");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Optionally, handle email errors specifically, e.g., log them, notify admin, etc.
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User login endpoint

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send("Invalid credentials");
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// User registration endpoint
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res.status(201).send("User created");
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.use(authRoutes);
// Example of a protected route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.send("This is a protected route");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});