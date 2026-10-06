/**
 * CampusCare - Student Complaint & Request Management System
 * Routes: Complaint Routes
 * 
 * Implements RESTful API endpoints:
 *  - GET    /api/complaints         -> List complaints (role-based: student sees only own, admin sees all)
 *  - GET    /api/complaints/stats   -> Summary counts for dashboard metrics
 *  - GET    /api/complaints/:id     -> Get single complaint by ID (with ownership check)
 *  - POST   /api/complaints         -> Create new complaint (auto-attaches logged-in student)
 *  - PUT    /api/complaints/:id     -> Full update of a complaint (Admin only)
 *  - PATCH  /api/complaints/:id/status -> Quick update of complaint status (Admin only)
 *  - DELETE /api/complaints/:id     -> Remove complaint (Admin only)
 *  - POST   /api/complaints/seed    -> Seed sample complaints (Admin only)
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Complaint = require('../models/Complaint');
const verifyAdmin = require('../middleware/authMiddleware');

// Helper to determine if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper to safely extract and verify JWT token if present
function resolveAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token || !token.trim()) return null;

  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  if (!jwtSecret) return null;

  try {
    return jwt.verify(token.trim(), jwtSecret);
  } catch (err) {
    return null;
  }
}

/**
 * @route   GET /api/complaints/stats
 * @desc    Get aggregate complaint statistics for student and admin dashboard cards
 * @access  Protected / Authenticated
 */
router.get('/stats', async (req, res) => {
  try {
    const user = resolveAuth(req);
    const { registerNumber } = req.query;
    const filter = {};

    if (user && user.role === 'student') {
      // Scoped strictly to this logged-in student
      filter.$or = [
        { studentId: user.id },
        { registerNumber: new RegExp(`^${user.registerNumber}$`, 'i') },
        { studentEmail: user.email.toLowerCase() }
      ];
    } else if (user && user.role === 'admin') {
      // Admin sees total campus stats, or optionally filtered by registerNumber
      if (registerNumber) {
        filter.registerNumber = registerNumber.trim().toUpperCase();
      }
    } else if (registerNumber) {
      // Fallback query by registerNumber
      filter.registerNumber = registerNumber.trim().toUpperCase();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view complaint statistics.'
      });
    }

    const [total, pending, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.countDocuments({ ...filter, status: 'Pending' }),
      Complaint.countDocuments({ ...filter, status: 'In Progress' }),
      Complaint.countDocuments({ ...filter, status: 'Resolved' })
    ]);

    const categoryCounts = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        resolved,
        categoryCounts
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/complaints
 * @desc    Retrieve complaints with role-based ownership filtering
 * @access  Protected
 */
router.get('/', async (req, res) => {
  try {
    const user = resolveAuth(req);
    const { search, status, category, department, registerNumber } = req.query;
    const query = {};

    if (user && user.role === 'student') {
      // Student can ONLY view their own complaints
      query.$or = [
        { studentId: user.id },
        { registerNumber: new RegExp(`^${user.registerNumber}$`, 'i') },
        { studentEmail: user.email.toLowerCase() }
      ];
    } else if (user && user.role === 'admin') {
      // Admin can view all complaints
      if (registerNumber) {
        query.registerNumber = registerNumber.trim().toUpperCase();
      }
    } else if (registerNumber) {
      // Backward-compatibility fallback
      query.registerNumber = registerNumber.trim().toUpperCase();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    // Filter by exact status if provided
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by exact category if provided
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by exact department if provided
    if (department && department !== 'All') {
      query.department = department;
    }

    // Text search by student name, register number, title, or ticketId
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchClause = {
        $or: [
          { studentName: searchRegex },
          { registerNumber: searchRegex },
          { title: searchRegex },
          { ticketId: searchRegex }
        ]
      };

      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          searchClause
        ];
        delete query.$or;
      } else {
        query.$or = searchClause.$or;
      }
    }

    // Retrieve sorted by latest date first
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error('Error retrieving complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/complaints/:id
 * @desc    Retrieve a single complaint by MongoDB _id or ticketId
 * @access  Protected / Student Ownership Verified
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = resolveAuth(req);
    const registerNumber = req.query.registerNumber;

    let complaint;

    if (isValidObjectId(id)) {
      complaint = await Complaint.findById(id);
    } else {
      complaint = await Complaint.findOne({ ticketId: id });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    // Admin has access to view any complaint
    if (user && user.role === 'admin') {
      return res.status(200).json({
        success: true,
        data: complaint
      });
    }

    // If logged-in student, verify complaint belongs to them
    if (user && user.role === 'student') {
      const isOwner =
        (complaint.studentId && String(complaint.studentId) === String(user.id)) ||
        (complaint.registerNumber && complaint.registerNumber.toUpperCase() === user.registerNumber.toUpperCase()) ||
        (complaint.studentEmail && complaint.studentEmail.toLowerCase() === user.email.toLowerCase());

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this complaint.'
        });
      }

      return res.status(200).json({
        success: true,
        data: complaint
      });
    }

    // Fallback: registerNumber match
    if (
      registerNumber &&
      String(complaint.registerNumber).trim().toLowerCase() ===
      String(registerNumber).trim().toLowerCase()
    ) {
      return res.status(200).json({
        success: true,
        data: complaint
      });
    }

    return res.status(401).json({
      success: false,
      message: 'You are not authorized to view this complaint.'
    });

  } catch (error) {
    console.error(`Error retrieving complaint ${req.params.id}:`, error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint details.'
    });
  }
});

/**
 * @route   POST /api/complaints
 * @desc    Submit a new complaint (auto-attaches logged-in student)
 * @access  Authenticated / Public fallback
 */
router.post('/', async (req, res) => {
  try {
    const user = resolveAuth(req);

    let {
      studentName,
      registerNumber,
      department,
      category,
      title,
      description,
      date,
      priority
    } = req.body;

    let studentId = null;
    let studentEmail = '';

    // If student is logged in, attach their identity automatically
    if (user && user.role === 'student') {
      studentId = user.id;
      studentName = user.name;
      studentEmail = user.email;
      registerNumber = user.registerNumber;
    }

    // Validate required fields
    if (!studentName || !registerNumber || !department || !category || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Name, Register Number, Department, Category, Title, and Description.'
      });
    }

    // Create new Complaint document
    const newComplaint = new Complaint({
      studentId: studentId,
      studentEmail: studentEmail,
      studentName: studentName.trim(),
      registerNumber: registerNumber.trim().toUpperCase(),
      department: department.trim(),
      category: category.trim(),
      title: title.trim(),
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      status: 'Pending',
      priority: priority || 'Medium'
    });

    const savedComplaint = await newComplaint.save();

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully!',
      data: savedComplaint
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while submitting complaint',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/complaints/:id
 * @desc    Edit/Update all details of an existing complaint (Admin functionality)
 * @access  Admin Only
 */
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Complaint ID format'
      });
    }

    const {
      studentName,
      registerNumber,
      department,
      category,
      title,
      description,
      status,
      priority,
      adminRemarks
    } = req.body;

    const updateData = {};
    if (studentName) updateData.studentName = studentName.trim();
    if (registerNumber) updateData.registerNumber = registerNumber.trim().toUpperCase();
    if (department) updateData.department = department.trim();
    if (category) updateData.category = category.trim();
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (status) updateData.status = status.trim();
    if (priority) updateData.priority = priority.trim();
    if (adminRemarks !== undefined) updateData.adminRemarks = adminRemarks.trim();

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      data: updatedComplaint
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Quick update of complaint status & admin remarks
 * @access  Admin Only
 */
router.patch('/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Complaint ID format'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status value is required (Pending, In Progress, or Resolved)'
      });
    }

    const validStatuses = ['Pending', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateObj = { status };
    if (adminRemarks !== undefined) {
      updateObj.adminRemarks = adminRemarks.trim();
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Complaint status updated to "${status}"`,
      data: updatedComplaint
    });
  } catch (error) {
    console.error('Error patching complaint status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Permanently delete a complaint
 * @access  Admin Only
 */
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Complaint ID format'
      });
    }

    const deletedComplaint = await Complaint.findByIdAndDelete(id);

    if (!deletedComplaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found to delete'
      });
    }

    res.status(200).json({
      success: true,
      message: `Complaint "${deletedComplaint.ticketId || deletedComplaint.title}" deleted successfully`,
      data: deletedComplaint
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/complaints/seed
 * @desc    Seed sample complaints for testing and viva presentation
 * @access  Admin Only
 */
router.post('/seed', verifyAdmin, async (req, res) => {
  try {
    const existingCount = await Complaint.countDocuments();

    // Preserve all existing complaints
    if (existingCount > 0) {
      return res.status(200).json({
        success: true,
        message: `Database already contains ${existingCount} complaints. Existing records have been preserved.`,
        count: existingCount
      });
    }

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
      }
    ];

    const inserted = await Complaint.insertMany(sampleComplaints);

    return res.status(201).json({
      success: true,
      message: `Successfully seeded ${inserted.length} sample complaints into MongoDB!`,
      count: inserted.length,
      data: inserted
    });

  } catch (error) {
    console.error('Error seeding complaints:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to seed complaints',
      error: error.message
    });
  }
});

module.exports = router;
