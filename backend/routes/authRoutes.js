const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const { verifyStudent } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * =========================================================================
 * ADMIN LOGIN (EXISTING - DO NOT MODIFY FUNCTIONALITY)
 * =========================================================================
 */
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter username and password."
            });
        }

        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        const jwtSecret = process.env.JWT_SECRET;

        if (!adminUsername || !adminPasswordHash || !jwtSecret) {
            console.error("Admin authentication environment variables are missing.");

            return res.status(500).json({
                success: false,
                message: "Login is not configured on the server."
            });
        }

        const inputUsername = String(username).trim();
        const storedUsername = String(adminUsername).trim();

        if (inputUsername !== storedUsername) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        const cleanHash = String(adminPasswordHash).trim();

        const passwordMatches = await bcrypt.compare(
            password,
            cleanHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        const token = jwt.sign(
            {
                username: storedUsername,
                role: "admin"
            },
            jwtSecret.trim(),
            {
                expiresIn: "2h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful.",
            token
        });

    } catch (error) {
        console.error("Admin login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error during login."
        });
    }
});

/**
 * Helper: Validate Gmail format according to requirements
 */
function validateGmail(rawEmail) {
    if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.trim()) {
        return { valid: false, message: "Please enter your email address." };
    }

    const clean = rawEmail.trim();

    // Check if it's not a complete email (e.g. no @, or ending with @, or no domain)
    if (!clean.includes("@")) {
        return {
            valid: false,
            message: `Please enter the complete Gmail address, for example: ${clean}@gmail.com`
        };
    }

    const parts = clean.split("@");
    if (parts.length !== 2) {
        return {
            valid: false,
            message: "Please enter a valid Gmail address ending with @gmail.com."
        };
    }

    const [localPart, domainPart] = parts;

    if (!domainPart || domainPart.toLowerCase() === "gmail" || !domainPart.includes(".")) {
        return {
            valid: false,
            message: `Please enter the complete Gmail address, for example: ${localPart || "student"}@gmail.com`
        };
    }

    if (domainPart.toLowerCase() !== "gmail.com") {
        return {
            valid: false,
            message: "Please use a Gmail address ending with @gmail.com."
        };
    }

    const gmailRegex = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(clean)) {
        return {
            valid: false,
            message: "Please enter a valid Gmail address ending with @gmail.com."
        };
    }

    return { valid: true, email: clean.toLowerCase() };
}

/**
 * =========================================================================
 * STUDENT REGISTRATION
 * =========================================================================
 */
router.post("/student/register", async (req, res) => {
    try {
        const { name, registerNumber, email, password, confirmPassword } = req.body || {};

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your name."
            });
        }

        if (!registerNumber || !String(registerNumber).trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your register number."
            });
        }

        const emailValidation = validateGmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({
                success: false,
                message: emailValidation.message
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        const cleanEmail = emailValidation.email;
        const cleanRegNo = String(registerNumber).trim().toUpperCase();
        const cleanName = String(name).trim();

        // Check if student with this email already exists
        const existingEmail = await Student.findOne({ email: cleanEmail });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered. Please login."
            });
        }

        // Check if register number is already registered
        const existingReg = await Student.findOne({ registerNumber: cleanRegNo });
        if (existingReg) {
            return res.status(409).json({
                success: false,
                message: "This register number is already registered."
            });
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new Student document
        const newStudent = new Student({
            name: cleanName,
            registerNumber: cleanRegNo,
            email: cleanEmail,
            password: hashedPassword,
            role: "student"
        });

        await newStudent.save();

        return res.status(201).json({
            success: true,
            message: "Student account created successfully! You can now login.",
            student: {
                id: newStudent._id,
                name: newStudent.name,
                registerNumber: newStudent.registerNumber,
                email: newStudent.email,
                role: "student"
            }
        });

    } catch (error) {
        console.error("Student registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during student registration.",
            error: error.message
        });
    }
});

/**
 * =========================================================================
 * STUDENT LOGIN
 * =========================================================================
 */
router.post("/student/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};

        const emailValidation = validateGmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({
                success: false,
                message: emailValidation.message
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Please enter your password."
            });
        }

        const cleanEmail = emailValidation.email;

        // Find student by email
        const student = await Student.findOne({ email: cleanEmail });
        if (!student) {
            return res.status(401).json({
                success: false,
                message: "No student account found with this email. Please register first."
            });
        }

        // Validate password
        const passwordMatches = await bcrypt.compare(password, student.password);
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password. Please try again."
            });
        }

        const jwtSecret = (process.env.JWT_SECRET || "campuscare-default-secret").trim();

        // Generate student JWT with role: "student"
        const token = jwt.sign(
            {
                id: student._id,
                name: student.name,
                registerNumber: student.registerNumber,
                email: student.email,
                role: "student"
            },
            jwtSecret,
            {
                expiresIn: "24h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Student login successful.",
            token,
            student: {
                id: student._id,
                name: student.name,
                registerNumber: student.registerNumber,
                email: student.email,
                role: "student"
            }
        });

    } catch (error) {
        console.error("Student login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during student login.",
            error: error.message
        });
    }
});

/**
 * =========================================================================
 * GET CURRENT AUTHENTICATED STUDENT
 * =========================================================================
 */
router.get("/student/me", verifyStudent, async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).select("-password");
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        return res.status(200).json({
            success: true,
            student: {
                id: student._id,
                name: student.name,
                registerNumber: student.registerNumber,
                email: student.email,
                role: "student"
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve student profile.",
            error: error.message
        });
    }
});

module.exports = router;