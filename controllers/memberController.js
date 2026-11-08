const Member = require("../models/Member");
const { uploadToCloudinary } = require("../config/cloudinary");
const { getDBStatus } = require("../config/db");
const {
  getLocalMembers,
  saveLocalMember,
  updateLocalMemberStatus,
  deleteLocalMember,
} = require("../utils/localStore");

/**
 * Register a new Gym Member
 * POST /api/members/register
 */
exports.registerMember = async (req, res) => {
  try {
    const { name, fatherName, contact, idCardNo, address, picture } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!fatherName || !fatherName.trim()) {
      return res.status(400).json({ error: "Father Name is required" });
    }
    if (!contact || !contact.trim()) {
      return res.status(400).json({ error: "Contact number is required" });
    }
    if (!idCardNo || !idCardNo.trim()) {
      return res.status(400).json({ error: "ID Card / CNIC number is required" });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: "Address is required" });
    }
    if (!picture) {
      return res.status(400).json({ error: "Member picture is required" });
    }

    // 1. Upload picture to Cloudinary
    let cloudinaryResult = null;
    try {
      cloudinaryResult = await uploadToCloudinary(picture, "fg_sm_fitness_members");
    } catch (uploadErr) {
      console.error("Cloudinary upload failed:", uploadErr);
      return res.status(500).json({
        error: `Cloudinary upload error: ${uploadErr.message || "Failed to upload photo"}`,
      });
    }

    // 2. Generate Unique Membership ID
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const membershipId = `FGSM-${year}-${randomSuffix}`;

    const memberData = {
      membershipId,
      name: name.trim(),
      fatherName: fatherName.trim(),
      contact: contact.trim(),
      idCardNo: idCardNo.trim(),
      picture: cloudinaryResult.url,
      picturePublicId: cloudinaryResult.public_id,
      address: address.trim(),
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    // 3. Try Saving to MongoDB Atlas
    let savedRecord = null;
    let storageType = "mongodb";
    let warning = null;

    const { isConnected } = getDBStatus();
    if (isConnected) {
      try {
        const newMember = new Member(memberData);
        savedRecord = await newMember.save();
        // Backup locally
        saveLocalMember({ ...memberData, _id: savedRecord._id.toString() });
      } catch (dbErr) {
        console.warn("MongoDB save failed, saving locally:", dbErr.message);
        storageType = "local";
        warning = dbErr.message;
        savedRecord = saveLocalMember({
          ...memberData,
          _id: "local_" + Date.now(),
        });
      }
    } else {
      storageType = "local";
      warning = "MongoDB Atlas is currently unavailable. Record saved to local database.";
      savedRecord = saveLocalMember({
        ...memberData,
        _id: "local_" + Date.now(),
      });
    }

    return res.status(201).json({
      success: true,
      message: "Member successfully registered!",
      member: savedRecord,
      storageType,
      warning,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error during registration",
    });
  }
};

/**
 * Get All Members (with search and status filters)
 * GET /api/members
 */
exports.getAllMembers = async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;
    const { isConnected } = getDBStatus();

    let members = [];
    let dataSource = "local";

    if (isConnected) {
      try {
        const query = {};
        if (status && status !== "All") {
          query.status = status;
        }
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: "i" } },
            { fatherName: { $regex: search, $options: "i" } },
            { idCardNo: { $regex: search, $options: "i" } },
            { contact: { $regex: search, $options: "i" } },
            { membershipId: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
          ];
        }

        members = await Member.find(query).sort({ createdAt: -1 }).lean();
        dataSource = "mongodb";
      } catch (dbErr) {
        console.warn("MongoDB query failed, falling back to local:", dbErr.message);
      }
    }

    // Fallback if MongoDB didn't return
    if (dataSource === "local") {
      let localList = getLocalMembers();
      if (status && status !== "All") {
        localList = localList.filter((m) => m.status === status);
      }
      if (search) {
        const s = search.toLowerCase();
        localList = localList.filter(
          (m) =>
            m.name?.toLowerCase().includes(s) ||
            m.fatherName?.toLowerCase().includes(s) ||
            m.idCardNo?.toLowerCase().includes(s) ||
            m.contact?.toLowerCase().includes(s) ||
            m.membershipId?.toLowerCase().includes(s) ||
            m.address?.toLowerCase().includes(s)
        );
      }
      members = localList;
    }

    return res.status(200).json({
      success: true,
      count: members.length,
      members,
      dataSource,
    });
  } catch (error) {
    console.error("Fetch members error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch members" });
  }
};

/**
 * Get Dashboard & Admin Stats
 * GET /api/members/stats
 */
exports.getStats = async (req, res) => {
  try {
    const { isConnected } = getDBStatus();
    let all = [];

    if (isConnected) {
      try {
        all = await Member.find({}).lean();
      } catch (err) {
        all = getLocalMembers();
      }
    } else {
      all = getLocalMembers();
    }

    const total = all.length;
    const active = all.filter((m) => (m.status || "Active") === "Active").length;
    const inactive = all.filter((m) => m.status === "Inactive").length;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonth = all.filter((m) => {
      const d = new Date(m.createdAt);
      return d >= startOfMonth;
    }).length;

    return res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        inactive,
        thisMonth,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load stats" });
  }
};

/**
 * Get Single Member
 * GET /api/members/:id
 */
exports.getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = getDBStatus();

    let member = null;
    if (isConnected) {
      try {
        member = await Member.findById(id).lean();
      } catch (e) {
        // invalid objectId or not found in mongo
      }
    }

    if (!member) {
      const list = getLocalMembers();
      member = list.find((m) => m._id === id || m.membershipId === id);
    }

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    return res.status(200).json({ success: true, member });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to fetch member" });
  }
};

/**
 * Update Member Status
 * PATCH /api/members/:id/status
 */
exports.updateMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive", "Pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const { isConnected } = getDBStatus();
    let updated = null;

    if (isConnected) {
      try {
        updated = await Member.findByIdAndUpdate(id, { status }, { new: true });
      } catch (e) {}
    }

    updateLocalMemberStatus(id, status);

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      member: updated || { _id: id, status },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to update status" });
  }
};

/**
 * Delete Member
 * DELETE /api/members/:id
 */
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = getDBStatus();

    if (isConnected) {
      try {
        await Member.findByIdAndDelete(id);
      } catch (e) {}
    }

    deleteLocalMember(id);

    return res.status(200).json({
      success: true,
      message: "Member record deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to delete member" });
  }
};

