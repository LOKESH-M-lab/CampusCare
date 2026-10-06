/**
 * CampusCare - Student Complaint & Request Management System
 * Model: Student
 * 
 * Description:
 * Defines the Mongoose schema and model for authenticated college students.
 * Includes student name, register number, Gmail, hashed password, and role.
 */

const mongoosePkg = require('mongoose');

const studentSchema = new mongoosePkg.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long']
    },
    registerNumber: {
      type: String,
      required: [true, 'Register number is required'],
      trim: true,
      uppercase: true,
      unique: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[A-Za-z0-9._%+-]+@gmail\.com$/, 'Please enter a valid Gmail address ending with @gmail.com']
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      default: 'student',
      enum: ['student']
    }
  },
  {
    timestamps: true,
    collection: 'students'
  }
);

const Student = mongoosePkg.model('Student', studentSchema);

module.exports = Student;
