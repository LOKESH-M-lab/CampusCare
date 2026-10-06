/**
 * CampusCare – Database Seeder Script
 * 
 * Run with: npm run seed
 * Populates MongoDB with realistic college complaint records for demonstrations and testing.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Complaint = require('./models/Complaint');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuscare';

const sampleComplaints = [
  {
    ticketId: 'CC-1001',
    studentName: 'Aravind Kumar',
    registerNumber: '710022104001',
    department: 'Computer Science and Engineering',
    category: 'Wi-Fi / Internet',
    title: 'Slow Wi-Fi connectivity in CSE Block 3rd Floor',
    description: 'The Wi-Fi access point in Room 304 keeps disconnecting every 5 minutes during practical sessions.',
    status: 'In Progress',
    priority: 'High',
    adminRemarks: 'Network administrator notified. Router firmware update scheduled.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    ticketId: 'CC-1002',
    studentName: 'Sneha Raman',
    registerNumber: '710022104045',
    department: 'Information Technology',
    category: 'Laboratory',
    title: 'Defective monitor in Operating Systems Lab (Lab 2, System 14)',
    description: 'System 14 display has heavy flickering and horizontal blue lines, making it impossible to work on Linux lab assignments.',
    status: 'Pending',
    priority: 'Medium',
    adminRemarks: '',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    ticketId: 'CC-1003',
    studentName: 'Mohammed Faiz',
    registerNumber: '710022106012',
    department: 'Electronics and Communication Engineering',
    category: 'Classroom',
    title: 'Projector HDMI port damaged in ECE Hall 102',
    description: 'Unable to connect laptops for seminar presentations as the HDMI port on the ceiling projector is loose.',
    status: 'Resolved',
    priority: 'High',
    adminRemarks: 'Replaced HDMI cable and tested projector with seminar laptop. Working fine now.',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    ticketId: 'CC-1004',
    studentName: 'Kavitha S',
    registerNumber: '710022104022',
    department: 'Computer Science and Engineering',
    category: 'Hostel',
    title: 'Water dispenser cooling issue in Girls Hostel Block B',
    description: 'The water purifier in the 2nd floor corridor is not dispensing drinking water properly; flow rate is very low.',
    status: 'In Progress',
    priority: 'Medium',
    adminRemarks: 'Maintenance technician dispatched for filter servicing.',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000)
  },
  {
    ticketId: 'CC-1005',
    studentName: 'Rohan Sharma',
    registerNumber: '710022114030',
    department: 'Mechanical Engineering',
    category: 'Cleanliness',
    title: 'Restroom cleanliness required near Workshop Section',
    description: 'Regular sanitation and water supply maintenance needed in the ground floor restroom beside the foundry lab.',
    status: 'Resolved',
    priority: 'Medium',
    adminRemarks: 'Housekeeping team dispatched and deep cleaned on 30th Sept.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    ticketId: 'CC-1006',
    studentName: 'Priya Dharshini',
    registerNumber: '710022104038',
    department: 'Artificial Intelligence and Data Science',
    category: 'Library',
    title: 'Need additional copies of "Database System Concepts" (Silberschatz)',
    description: 'All 4 copies of Silberschatz 7th edition are checked out and 15 students have upcoming internal assessments.',
    status: 'Pending',
    priority: 'Low',
    adminRemarks: '',
    date: new Date(Date.now() - 6 * 60 * 60 * 1000)
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected! Clearing existing complaints...');
    await Complaint.deleteMany({});

    console.log('Inserting sample complaints...');
    const result = await Complaint.insertMany(sampleComplaints);
    console.log(`✅ Success! Seeded ${result.length} complaints into the "complaints" collection.`);

    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seedDatabase();
