/**
 * CampusCare - Student Complaint & Request Management System
 * Model: Complaint
 * 
 * Description:
 * Defines the Mongoose schema and model for complaints stored in MongoDB.
 * Includes student details, complaint category, status workflow, and timestamps.
 */

const mongoose = require('express'); // to avoid typo, require mongoose
const mongoosePkg = require('mongoose');

// Define allowed categories and statuses as constants for reusability & validation
const CATEGORIES = [
  'Classroom',
  'Laboratory',
  'Wi-Fi / Internet',
  'Hostel',
  'Canteen',
  'Library',
  'Cleanliness',
  'Other'
];

const STATUSES = ['Pending', 'In Progress', 'Resolved'];

const complaintSchema = new mongoosePkg.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
      trim: true
    },
    studentId: {
      type: mongoosePkg.Schema.Types.ObjectId,
      ref: 'Student',
      default: null
    },
    studentEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    studentName: {
      type: String,
      required: [true, 'Student Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long']
    },
    registerNumber: {
      type: String,
      required: [true, 'Register Number is required'],
      trim: true,
      uppercase: true,
      match: [/^[A-Za-z0-9\-]+$/, 'Please enter a valid register number']
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category'
      }
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: STATUSES,
        message: '{VALUE} is not a valid status'
      },
      default: 'Pending'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    adminRemarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
    collection: 'complaints' // Explicitly sets the collection name to "complaints"
  }
);

// Pre-save hook: Generate a human-friendly ticket ID (e.g., CC-2415) if not already set
complaintSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `CC-${randomSuffix}`;
  }
  next();
});

const Complaint = mongoosePkg.model('Complaint', complaintSchema);

module.exports = Complaint;
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
