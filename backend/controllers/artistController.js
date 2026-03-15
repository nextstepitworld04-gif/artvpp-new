import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ArtistApplication } from "../models/ArtistApplication.js";
import { User } from "../models/User.js";
import { deleteMultipleImages } from "../config/cloudinary.js";
import { cleanupUploadedFiles } from "../middleware/upload.js";
import { sendArtistStatusEmail, sendOtpEmail } from "../utils/sendEmail.js";

/**
 * Artist Application Controller
 *
 * Handles the complete artist application flow:
 * 1. Submit application with details + images
 * 2. Verify email via OTP
 * 3. Admin reviews application
 * 4. Admin approves/rejects
 * 5. Email notification sent
 */

// ============================================
// USER: SUBMIT APPLICATION
// ============================================

/**
 * @desc    Submit artist application
 * @route   POST /api/v1/artist/apply
 * @access  Private (verified users only)
 */
export const submitApplication = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            await cleanupUploadedFiles(req.uploadedFiles);
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if already an artist
        if (user.role === "artist") {
            await cleanupUploadedFiles(req.uploadedFiles);
            return res.status(400).json({
                success: false,
                message: "You are already an artist"
            });
        }

        // Check for existing pending/under_review application
        const existingApplication = await ArtistApplication.findOne({
            userId,
            status: { $in: ["pending", "under_review"] }
        });

        if (existingApplication) {
            await cleanupUploadedFiles(req.uploadedFiles);
            return res.status(400).json({
                success: false,
                message: "You already have a pending application"
            });
        }

        // Check if rejected and can reapply
        const rejectedApplication = await ArtistApplication.findOne({
            userId,
            status: "rejected"
        }).sort({ createdAt: -1 });

        if (rejectedApplication && rejectedApplication.canReapplyAfter) {
            if (new Date() < rejectedApplication.canReapplyAfter) {
                await cleanupUploadedFiles(req.uploadedFiles);
                return res.status(400).json({
                    success: false,
                    message: `You can reapply after ${rejectedApplication.canReapplyAfter.toLocaleDateString()}`,
                    data: {
                        canReapplyAfter: rejectedApplication.canReapplyAfter
                    }
                });
            }
        }

        // Parse request body
        const {
            fullName,
            bio,
            secondaryPhone,
            secondaryEmail,
            street,
            city,
            state,
            pincode,
            country,
            instagram,
            twitter,
            facebook,
            linkedin,
            youtube,
            behance,
            dribbble,
            otherSocial,
            portfolioWebsite,
            artworkTitles,      // JSON string array
            artworkDescriptions // JSON string array
        } = req.body;

        // Debug: Log uploaded files
        console.log("Uploaded files:", req.uploadedFiles);

        // Validate uploaded files exist
        if (!req.uploadedFiles || !req.uploadedFiles.profilePicture) {
            await cleanupUploadedFiles(req.uploadedFiles);
            return res.status(400).json({
                success: false,
                message: "Profile picture is required"
            });
        }

        if (!req.uploadedFiles.artworks || req.uploadedFiles.artworks.length !== 5) {
            await cleanupUploadedFiles(req.uploadedFiles);
            return res.status(400).json({
                success: false,
                message: "Exactly 5 artworks are required"
            });
        }

        // Validate secondary email is provided
        if (!secondaryEmail || !secondaryEmail.trim()) {
            await cleanupUploadedFiles(req.uploadedFiles);
            return res.status(400).json({
                success: false,
                message: "Secondary email is required"
            });
        }

        // Validate secondary phone is provided
        if (!secondaryPhone || !secondaryPhone.trim()) {
            await cleanupUploadedFiles(req.uploadedFiles);
            return res.status(400).json({
                success: false,
                message: "Secondary phone is required"
            });
        }

        // Clean phone number (remove all non-digit characters)
        const cleanPhone = secondaryPhone.replace(/\D/g, '');
        console.log("Original phone:", secondaryPhone, "Cleaned phone:", cleanPhone);

        // Handle phone with country code - keep last 10 digits
        let phoneNumber = cleanPhone;
        if (cleanPhone.length > 10) {
            phoneNumber = cleanPhone.slice(-10);
        }

        console.log("Final phone number:", phoneNumber, "Length:", phoneNumber.length);

        if (phoneNumber.length !== 10) {
            await cleanupUploadedFiles(req.uploadedFiles);
            return res.status(400).json({
                success: false,
                message: `Phone number must be exactly 10 digits. You entered: ${secondaryPhone} (${cleanPhone.length} digits after cleaning)`
            });
        }

        // Validate bio word count (minimum 15 words)
        const wordCount = bio.trim().split(/\s+/).length;
        if (wordCount < 15) {
            await cleanupUploadedFiles(req.uploadedFiles);
            return res.status(400).json({
                success: false,
                message: `Bio must have at least 15 words. Current: ${wordCount} words`
            });
        }

        // Parse artwork titles and descriptions
        let titles = [];
        let descriptions = [];

        try {
            titles = artworkTitles ? JSON.parse(artworkTitles) : [];
            descriptions = artworkDescriptions ? JSON.parse(artworkDescriptions) : [];
        } catch (e) {
            // If not JSON, try comma-separated
            titles = artworkTitles ? artworkTitles.split(",").map(t => t.trim()) : [];
            descriptions = artworkDescriptions ? artworkDescriptions.split(",").map(d => d.trim()) : [];
        }

        // Build artworks array with uploaded files
        const artworks = req.uploadedFiles.artworks.map((artwork, index) => ({
            url: artwork.url,
            publicId: artwork.publicId,
            title: titles[index] || `Artwork ${index + 1}`,
            description: descriptions[index] || ""
        }));

        // Create application with new field structure
        const application = new ArtistApplication({
            userId,
            fullName,
            profilePicture: {
                url: req.uploadedFiles.profilePicture.url,
                publicId: req.uploadedFiles.profilePicture.publicId
            },
            bio,
            // Primary contact info (from user's account)
            primaryPhone: user.phone || null,
            primaryEmail: user.email,
            // Secondary contact info (from form)
            secondaryPhone: {
                number: phoneNumber,
                isVerified: false
            },
            secondaryEmail: {
                address: secondaryEmail.trim().toLowerCase(),
                isVerified: false
            },
            address: {
                street,
                city,
                state,
                pincode,
                country: country || "India"
            },
            artworks,
            socialMedia: {
                instagram: instagram || null,
                twitter: twitter || null,
                facebook: facebook || null,
                linkedin: linkedin || null,
                youtube: youtube || null,
                behance: behance || null,
                dribbble: dribbble || null,
                other: otherSocial || null
            },
            portfolioWebsite: portfolioWebsite || null,
            status: "pending",
            applicationVersion: rejectedApplication
                ? rejectedApplication.applicationVersion + 1
                : 1
        });

        await application.save();

        // Update user's artistRequest status
        user.artistRequest.status = "pending";
        user.artistRequest.requestedAt = new Date();
        await user.save();

        return res.status(201).json({
            success: true,
            message: "Application submitted successfully! Please verify your secondary email.",
            data: {
                applicationId: application._id,
                status: application.status,
                secondaryEmailVerified: application.secondaryEmail.isVerified,
                submittedAt: application.submittedAt
            }
        });

    } catch (error) {
        console.error("Submit application error:", error);

        // Cleanup uploaded files on error
        if (req.uploadedFiles) {
            await cleanupUploadedFiles(req.uploadedFiles);
        }

        return res.status(500).json({
            success: false,
            message: "Failed to submit application. Please try again."
        });
    }
};

// ============================================
// USER: SEND EMAIL OTP FOR VERIFICATION
// ============================================

/**
 * @desc    Send OTP to verify secondary email in application
 * @route   POST /api/v1/artist/send-email-otp
 * @access  Private
 */
export const sendEmailOtp = async (req, res) => {
    try {
        const userId = req.userId;

        const application = await ArtistApplication.findOne({
            userId,
            status: { $in: ["pending", "under_review"] }
        })
            .sort({ createdAt: -1 })
            .select("+secondaryEmail.otp +secondaryEmail.otpExpiry");

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "No pending application found"
            });
        }

        if (application.secondaryEmail.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Secondary email is already verified"
            });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Hash OTP before storing
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Store OTP with 10 minute expiry
        application.secondaryEmail.otp = hashedOtp;
        application.secondaryEmail.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await application.save();

        // Send OTP email
        await sendOtpEmail(application.secondaryEmail.address, otp, application.fullName, "artist-verification");

        return res.status(200).json({
            success: true,
            message: "OTP sent to your secondary email. Valid for 10 minutes.",
            data: {
                email: application.secondaryEmail.address.replace(/(.{2})(.*)(@.*)/, "$1***$3") // Mask email
            }
        });

    } catch (error) {
        console.error("Send email OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });
    }
};

// ============================================
// USER: VERIFY EMAIL OTP
// ============================================

/**
 * @desc    Verify secondary email OTP for application
 * @route   POST /api/v1/artist/verify-email-otp
 * @access  Private
 */
export const verifyEmailOtp = async (req, res) => {
    try {
        const userId = req.userId;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required"
            });
        }

        const application = await ArtistApplication.findOne({
            userId,
            status: { $in: ["pending", "under_review"] }
        })
            .sort({ createdAt: -1 })
            .select("+secondaryEmail.otp +secondaryEmail.otpExpiry");

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "No pending application found"
            });
        }

        if (application.secondaryEmail.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Secondary email is already verified"
            });
        }

        // Check OTP expiry
        if (!application.secondaryEmail.otp || !application.secondaryEmail.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "No OTP found. Please request a new one."
            });
        }

        if (application.secondaryEmail.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Verify OTP
        const isOtpValid = await bcrypt.compare(otp, application.secondaryEmail.otp);

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Mark email as verified
        application.secondaryEmail.isVerified = true;
        application.secondaryEmail.otp = null;
        application.secondaryEmail.otpExpiry = null;

        // Once email is verified, move application into admin review queue.
        if (application.status === "pending") {
            application.status = "under_review";
        }

        await application.save();

        return res.status(200).json({
            success: true,
            message: "Secondary email verified successfully! Your application has been sent for admin review.",
            data: {
                applicationId: application._id,
                status: application.status,
                secondaryEmailVerified: true
            }
        });

    } catch (error) {
        console.error("Verify email OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
};

// ============================================
// USER: GET MY APPLICATION STATUS
// ============================================

/**
 * @desc    Get current user's application status
 * @route   GET /api/v1/artist/my-application
 * @access  Private
 */
export const getMyApplication = async (req, res) => {
    try {
        const userId = req.userId;

        const application = await ArtistApplication.findOne({ userId })
            .sort({ createdAt: -1 }); // Get latest application

        if (!application) {
            // Return 200 with hasApplication: false (not 404)
            // This is a valid response - user just hasn't applied yet
            return res.status(200).json({
                success: true,
                message: "No application found",
                data: {
                    hasApplication: false,
                    application: null
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Application fetched successfully",
            data: {
                hasApplication: true,
                application: application.toSafeObject()
            }
        });

    } catch (error) {
        console.error("Get my application error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch application"
        });
    }
};

// ============================================
// ADMIN: GET ALL APPLICATIONS
// ============================================

/**
 * @desc    Get all artist applications (with filters)
 * @route   GET /api/v1/artist/admin/applications
 * @access  Private/Admin
 */
export const getAllApplications = async (req, res) => {
    try {
        const {
            status = "pending",
            page = 1,
            limit = 10,
            sortBy = "submittedAt",
            sortOrder = "desc"
        } = req.query;

        const query = {};

        // Filter by status (all, pending, under_review, approved, rejected)
        if (status !== "all") {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [applications, total] = await Promise.all([
            ArtistApplication.find(query)
                .populate("userId", "username email avatar createdAt")
                .populate("reviewedBy", "username email")
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            ArtistApplication.countDocuments(query)
        ]);

        // Get counts for each status (for admin dashboard tabs)
        const statusCounts = await ArtistApplication.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const counts = {
            pending: 0,
            under_review: 0,
            approved: 0,
            rejected: 0,
            total: 0
        };

        statusCounts.forEach(item => {
            counts[item._id] = item.count;
            counts.total += item.count;
        });

        return res.status(200).json({
            success: true,
            message: "Applications fetched successfully",
            data: {
                applications: applications.map(app => app.toSafeObject()),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit)),
                    hasMore: parseInt(page) * parseInt(limit) < total
                },
                statusCounts: counts
            }
        });

    } catch (error) {
        console.error("Get all applications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch applications"
        });
    }
};

// ============================================
// ADMIN: GET SINGLE APPLICATION DETAILS
// ============================================

/**
 * @desc    Get single application details
 * @route   GET /api/v1/artist/admin/applications/:applicationId
 * @access  Private/Admin
 */
export const getApplicationDetails = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await ArtistApplication.findById(applicationId)
            .populate("userId", "username email avatar createdAt isVerified role")
            .populate("reviewedBy", "username email");

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Application details fetched",
            data: {
                application: application.toSafeObject()
            }
        });

    } catch (error) {
        console.error("Get application details error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch application details"
        });
    }
};

// ============================================
// ADMIN: APPROVE APPLICATION
// ============================================

/**
 * @desc    Approve artist application
 * @route   PUT /api/v1/artist/admin/applications/:applicationId/approve
 * @access  Private/Admin
 */
export const approveApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const adminId = req.userId;
        const { adminNotes } = req.body;

        const application = await ArtistApplication.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        if (application.status === "approved") {
            return res.status(400).json({
                success: false,
                message: "Application is already approved"
            });
        }

        if (application.status === "rejected") {
            return res.status(400).json({
                success: false,
                message: "Cannot approve a rejected application"
            });
        }

        // Check if secondary email is verified
        if (!application.secondaryEmail.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Cannot approve: Secondary email is not verified"
            });
        }

        // Update application status
        application.status = "approved";
        application.reviewedBy = adminId;
        application.reviewedAt = new Date();
        application.adminNotes = adminNotes || null;
        await application.save();

        // Update user role to artist
        const user = await User.findById(application.userId);
        if (user) {
            user.role = "artist";
            user.artistRequest.status = "approved";
            user.artistRequest.reviewedAt = new Date();
            user.artistRequest.reviewedBy = adminId;

            // Update user profile with artist info
            user.avatar = user.avatar || application.profilePicture.url;

            await user.save();

            // Send approval email to both primary and secondary emails
            await sendArtistStatusEmail(
                application.primaryEmail,
                application.fullName,
                "approved"
            ).catch(console.error);

            // Also notify secondary email
            await sendArtistStatusEmail(
                application.secondaryEmail.address,
                application.fullName,
                "approved"
            ).catch(console.error);
        }

        return res.status(200).json({
            success: true,
            message: "Application approved successfully! Artist has been notified.",
            data: {
                applicationId: application._id,
                status: application.status,
                userId: application.userId,
                approvedAt: application.reviewedAt
            }
        });

    } catch (error) {
        console.error("Approve application error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to approve application"
        });
    }
};

// ============================================
// ADMIN: REJECT APPLICATION
// ============================================

/**
 * @desc    Reject artist application
 * @route   PUT /api/v1/artist/admin/applications/:applicationId/reject
 * @access  Private/Admin
 */
export const rejectApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const adminId = req.userId;
        const { rejectionReason, adminNotes, cooldownDays = 3 } = req.body;

        const application = await ArtistApplication.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        if (application.status === "rejected") {
            return res.status(400).json({
                success: false,
                message: "Application is already rejected"
            });
        }

        if (application.status === "approved") {
            return res.status(400).json({
                success: false,
                message: "Cannot reject an approved application"
            });
        }

        // Update application status
        application.status = "rejected";
        application.reviewedBy = adminId;
        application.reviewedAt = new Date();
        application.rejectionReason = rejectionReason || null; // Optional
        application.adminNotes = adminNotes || null;

        // Set cooldown period for reapplication
        application.canReapplyAfter = new Date(
            Date.now() + cooldownDays * 24 * 60 * 60 * 1000
        );

        await application.save();

        // Update user's artistRequest status
        const user = await User.findById(application.userId);
        if (user) {
            user.artistRequest.status = "rejected";
            user.artistRequest.reviewedAt = new Date();
            user.artistRequest.reviewedBy = adminId;
            user.artistRequest.rejectionReason = rejectionReason || null;
            await user.save();

            // Send rejection email to primary email
            await sendArtistStatusEmail(
                application.primaryEmail,
                application.fullName,
                "rejected",
                rejectionReason
            ).catch(console.error);

            // Also notify secondary email
            await sendArtistStatusEmail(
                application.secondaryEmail.address,
                application.fullName,
                "rejected",
                rejectionReason
            ).catch(console.error);
        }

        return res.status(200).json({
            success: true,
            message: "Application rejected. Artist has been notified.",
            data: {
                applicationId: application._id,
                status: application.status,
                rejectionReason: application.rejectionReason,
                canReapplyAfter: application.canReapplyAfter
            }
        });

    } catch (error) {
        console.error("Reject application error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reject application"
        });
    }
};

// ============================================
// ADMIN: MARK AS UNDER REVIEW
// ============================================

/**
 * @desc    Mark application as under review
 * @route   PUT /api/v1/artist/admin/applications/:applicationId/review
 * @access  Private/Admin
 */
export const markUnderReview = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const adminId = req.userId;

        const application = await ArtistApplication.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        if (application.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot mark as under review. Current status: ${application.status}`
            });
        }

        application.status = "under_review";
        application.reviewedBy = adminId;
        await application.save();

        return res.status(200).json({
            success: true,
            message: "Application marked as under review",
            data: {
                applicationId: application._id,
                status: application.status
            }
        });

    } catch (error) {
        console.error("Mark under review error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update application status"
        });
    }
};

// ============================================
// ADMIN: DELETE APPLICATION
// ============================================

/**
 * @desc    Delete application (and cleanup images)
 * @route   DELETE /api/v1/artist/admin/applications/:applicationId
 * @access  Private/Admin
 */
export const deleteApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await ArtistApplication.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Collect all image public IDs for cleanup
        const publicIds = [application.profilePicture.publicId];
        application.artworks.forEach(artwork => {
            publicIds.push(artwork.publicId);
        });

        // Delete images from Cloudinary
        await deleteMultipleImages(publicIds).catch(console.error);

        // Delete application from database
        await ArtistApplication.deleteOne({ _id: applicationId });

        // Update user's artistRequest status
        const user = await User.findById(application.userId);
        if (user && user.artistRequest.status !== "approved") {
            user.artistRequest.status = "none";
            user.artistRequest.requestedAt = null;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: "Application deleted successfully"
        });

    } catch (error) {
        console.error("Delete application error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete application"
        });
    }
};

// ============================================
// ADMIN: GET DASHBOARD STATS
// ============================================

/**
 * @desc    Get artist application statistics for admin dashboard
 * @route   GET /api/v1/artist/admin/stats
 * @access  Private/Admin
 */
export const getApplicationStats = async (req, res) => {
    try {
        // Get counts by status
        const statusCounts = await ArtistApplication.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent applications (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentCount = await ArtistApplication.countDocuments({
            submittedAt: { $gte: sevenDaysAgo }
        });

        // Get applications per day for last 7 days (for chart)
        const dailyApplications = await ArtistApplication.aggregate([
            {
                $match: {
                    submittedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format response
        const stats = {
            pending: 0,
            under_review: 0,
            approved: 0,
            rejected: 0,
            total: 0
        };

        statusCounts.forEach(item => {
            stats[item._id] = item.count;
            stats.total += item.count;
        });

        return res.status(200).json({
            success: true,
            message: "Stats fetched successfully",
            data: {
                stats,
                recentApplications: recentCount,
                dailyTrend: dailyApplications
            }
        });

    } catch (error) {
        console.error("Get application stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch stats"
        });
    }
};

// ============================================
// ADMIN: SEND SUGGESTION TO ARTIST
// ============================================

/**
 * @desc    Send suggestion/feedback to artist applicant
 * @route   POST /api/v1/artist/admin/applications/:applicationId/suggestion
 * @access  Private/Admin
 */
export const sendSuggestion = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { suggestion } = req.body;

        if (!suggestion || !suggestion.trim()) {
            return res.status(400).json({
                success: false,
                message: "Suggestion text is required"
            });
        }

        const application = await ArtistApplication.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Send suggestion email
        const recipientEmail =
            application.secondaryEmail?.address || application.primaryEmail;

        if (!recipientEmail) {
            return res.status(400).json({
                success: false,
                message: "No recipient email found for this application"
            });
        }

        const { sendSuggestionEmail } = await import("../utils/sendEmail.js");
        await sendSuggestionEmail(
            recipientEmail,
            application.fullName,
            suggestion
        );

        return res.status(200).json({
            success: true,
            message: "Suggestion sent successfully to the artist"
        });

    } catch (error) {
        console.error("Send suggestion error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send suggestion"
        });
    }
};

