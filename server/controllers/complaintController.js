const Complaint = require("../models/Complaint");
const User = require("../models/User");

// Generate unique Complaint ID (e.g., CMP-2026-98234)
const generateComplaintId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CMP-${year}-${randomNum}`;
};

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Principal, Class Incharge, Subject Teacher, Student)
const createComplaint = async (req, res) => {
  try {
    const {
      classOrDepartment,
      category,
      subject,
      description,
      location,
      priority,
      attachmentUrl,
    } = req.body;

    if (!category || !subject || !description || !location) {
      return res.status(400).json({
        success: false,
        message: "Please provide category, subject, description, and location.",
      });
    }

    const complaintId = generateComplaintId();

    const newComplaint = await Complaint.create({
      complaintId,
      complainant: req.user._id,
      complainantName: req.user.name,
      complainantRole: req.user.role,
      classOrDepartment: classOrDepartment || "General",
      category,
      subject,
      description,
      location,
      priority: priority || "Medium",
      status: "Pending",
      attachmentUrl: attachmentUrl || "",
      statusHistory: [
        {
          status: "Pending",
          remark: "Complaint submitted successfully.",
          updatedBy: req.user.name,
          updatedAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully.",
      data: newComplaint,
    });
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting complaint.",
      error: error.message,
    });
  }
};

// @desc    Get complaints list with filters
// @route   GET /api/complaints
// @access  Private (Principal sees all; Student/Teacher sees their own)
const getComplaints = async (req, res) => {
  try {
    const { category, status, priority, role, search, startDate, endDate } = req.query;

    let query = {};

    // Role-based scoping: Non-Principals can only view complaints they created
    if (req.user.role !== "PRINCIPAL") {
      query.complainant = req.user._id;
    } else {
      // Principal filters
      if (role) {
        query.complainantRole = role;
      }
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { complainantName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate("complainant", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching complaints.",
      error: error.message,
    });
  }
};

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("complainant", "name email role")
      .populate("respondedBy", "name email role");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    // Check authorization: Principal or owner
    if (
      req.user.role !== "PRINCIPAL" &&
      complaint.complainant._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own complaints.",
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error fetching complaint details:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching complaint details.",
      error: error.message,
    });
  }
};

// @desc    Update complaint status & remark (Principal Only)
// @route   PUT /api/complaints/:id/status
// @access  Private (Principal Only)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;

    if (!status || !["Pending", "In Progress", "Resolved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (Pending, In Progress, Resolved, Rejected) is required.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    complaint.status = status;
    if (remark !== undefined) {
      complaint.responseRemark = remark;
    }
    complaint.respondedBy = req.user._id;
    complaint.respondedAt = new Date();

    complaint.statusHistory.push({
      status,
      remark: remark || `Status updated to ${status}`,
      updatedBy: req.user.name,
      updatedAt: new Date(),
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}.`,
      data: complaint,
    });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating complaint status.",
      error: error.message,
    });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
};
