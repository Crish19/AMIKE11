const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  websiteUrl:String,
  location: String,
});

module.exports = mongoose.model('Discount', discountSchema);
