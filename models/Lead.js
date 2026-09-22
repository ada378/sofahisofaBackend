import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Please enter a valid 10-digit Indian mobile number'
      }
    },
    source: {
      type: String,
      default: 'popup',
      enum: ['popup', 'contact-form', 'checkout', 'other']
    },
    status: {
      type: String,
      default: 'new',
      enum: ['new', 'contacted', 'converted', 'closed']
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
