const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../utils/emailService');

/**
 * @desc    Get current user profile with organization details
 * @route   GET /api/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    // Get user with populated tenant and roles
    const user = await User.findById(req.user._id)
      .populate('tenant', 'organizationId organizationName contactEmail contactPhone alternatePhone logo industry businessType subscription settings legalName website socialMedia numberOfEmployees foundedYear taxId registrationNumber headquarters keyContact')
      .populate('roles', 'name description')
      .populate('groups', 'name description')
      .select('-password -emailVerificationOTP -emailVerificationOTPExpire -resetPasswordOTP -resetPasswordOTPExpire');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Get tenant details if user has a tenant
    let tenantDetails = null;
    if (user.tenant) {
      tenantDetails = user.tenant;
    }

    return successResponse(res, {
      user,
      tenant: tenantDetails
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 'Error fetching profile', 500);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      profilePicture
    } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Update allowed fields only
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    // Log activity
    await logActivity({
      user: req.user._id,
      tenant: req.user.tenant,
      action: 'profile.update',
      entity: 'User',
      entityId: user._id,
      description: `Updated profile: ${user.firstName} ${user.lastName}`
    });

    // Get updated user with populated data
    const updatedUser = await User.findById(user._id)
      .populate('tenant', 'organizationId organizationName contactEmail contactPhone logo industry businessType')
      .populate('roles', 'name description')
      .select('-password -emailVerificationOTP -emailVerificationOTPExpire -resetPasswordOTP -resetPasswordOTPExpire');

    return successResponse(res, updatedUser, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 'Error updating profile', 500);
  }
};

/**
 * @desc    Update user password
 * @route   PUT /api/profile/password
 * @access  Private
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Please provide current and new password', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters', 400);
    }

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if user uses local authentication
    if (user.authProvider !== 'local' && user.authProvider) {
      return errorResponse(res, `You are signed in with ${user.authProvider}. Password change is not available.`, 400);
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    // Log activity
    await logActivity({
      user: req.user._id,
      tenant: req.user.tenant,
      action: 'profile.password_change',
      entity: 'User',
      entityId: user._id,
      description: 'Password changed successfully'
    });

    return successResponse(res, null, 'Password updated successfully');

  } catch (error) {
    console.error('Update password error:', error);
    return errorResponse(res, 'Error updating password', 500);
  }
};

/**
 * @desc    Upload profile picture
 * @route   POST /api/profile/upload-picture
 * @access  Private
 */
const uploadProfilePicture = async (req, res) => {
  try {
    // This endpoint expects file upload via multer
    // The actual file upload logic would be handled by multer middleware

    if (!req.file) {
      return errorResponse(res, 'Please upload an image file', 400);
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Store file path or URL (depending on storage strategy)
    user.profilePicture = req.file.path || `/uploads/${req.file.filename}`;
    await user.save();

    // Log activity
    await logActivity({
      user: req.user._id,
      tenant: req.user.tenant,
      action: 'profile.picture_upload',
      entity: 'User',
      entityId: user._id,
      description: 'Profile picture uploaded'
    });

    return successResponse(res, { profilePicture: user.profilePicture }, 'Profile picture uploaded successfully');

  } catch (error) {
    console.error('Upload picture error:', error);
    return errorResponse(res, 'Error uploading profile picture', 500);
  }
};

/**
 * @desc    Update organization information
 * @route   PUT /api/profile/organization
 * @access  Private (TENANT_ADMIN only)
 */
const updateOrganization = async (req, res) => {
  try {
    const {
      organizationName,
      contactEmail,
      contactPhone,
      alternatePhone,
      industry,
      businessType,
      legalName,
      logo,
      website,
      socialMedia,
      numberOfEmployees,
      foundedYear,
      taxId,
      registrationNumber,
      headquarters,
      keyContact
    } = req.body;

    // Check if user has a tenant
    if (!req.user.tenant) {
      return errorResponse(res, 'No organization associated with this user', 400);
    }

    // Only TENANT_ADMIN can update organization
    if (req.user.userType !== 'TENANT_ADMIN' && req.user.userType !== 'SAAS_OWNER') {
      return errorResponse(res, 'Only organization admin can update organization details', 403);
    }

    // Find tenant
    const tenant = await Tenant.findOne({
      _id: req.user.tenant
    });

    if (!tenant) {
      return errorResponse(res, 'Organization not found', 404);
    }

    // Check if profile was incomplete before
    const wasIncomplete = !tenant.organizationName || !tenant.contactEmail || !tenant.industry;

    // Update basic fields
    if (organizationName) tenant.organizationName = organizationName;
    if (contactEmail) tenant.contactEmail = contactEmail;
    if (contactPhone !== undefined) tenant.contactPhone = contactPhone;
    if (alternatePhone !== undefined) tenant.alternatePhone = alternatePhone;
    if (industry !== undefined) tenant.industry = industry;
    if (businessType) tenant.businessType = businessType;

    // Update new fields
    if (legalName !== undefined) tenant.legalName = legalName;
    if (logo !== undefined) tenant.logo = logo;
    if (website !== undefined) tenant.website = website;
    if (numberOfEmployees !== undefined) tenant.numberOfEmployees = numberOfEmployees;
    if (foundedYear !== undefined) tenant.foundedYear = foundedYear;
    if (taxId !== undefined) tenant.taxId = taxId;
    if (registrationNumber !== undefined) tenant.registrationNumber = registrationNumber;

    // Update nested objects
    if (socialMedia) {
      tenant.socialMedia = {
        linkedin: socialMedia.linkedin || tenant.socialMedia?.linkedin || '',
        twitter: socialMedia.twitter || tenant.socialMedia?.twitter || '',
        facebook: socialMedia.facebook || tenant.socialMedia?.facebook || '',
        instagram: socialMedia.instagram || tenant.socialMedia?.instagram || ''
      };
    }

    if (headquarters) {
      tenant.headquarters = {
        street: headquarters.street || tenant.headquarters?.street || '',
        city: headquarters.city || tenant.headquarters?.city || '',
        state: headquarters.state || tenant.headquarters?.state || '',
        country: headquarters.country || tenant.headquarters?.country || '',
        zipCode: headquarters.zipCode || tenant.headquarters?.zipCode || ''
      };
    }

    if (keyContact) {
      tenant.keyContact = {
        name: keyContact.name || tenant.keyContact?.name || '',
        designation: keyContact.designation || tenant.keyContact?.designation || '',
        email: keyContact.email || tenant.keyContact?.email || '',
        phone: keyContact.phone || tenant.keyContact?.phone || ''
      };
    }

    await tenant.save();

    // Check if profile is now complete
    const isNowComplete = tenant.organizationName && tenant.contactEmail && tenant.industry;

    // Send welcome email if profile just got completed
    if (wasIncomplete && isNowComplete) {
      try {
        const user = await User.findById(req.user._id);
        await sendWelcomeEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          tenant.organizationName
        );
        console.log('✅ Welcome email sent to:', user.email);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError.message);
        // Don't fail the profile update if email fails
      }
    }

    // Log activity
    await logActivity({
      user: req.user._id,
      tenant: req.user.tenant,
      action: 'organization.update',
      entity: 'Tenant',
      entityId: tenant._id,
      description: `Updated organization: ${tenant.organizationName}`
    });

    return successResponse(res, tenant, 'Organization updated successfully');

  } catch (error) {
    console.error('Update organization error:', error);
    return errorResponse(res, 'Error updating organization', 500);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  uploadProfilePicture,
  updateOrganization
};
