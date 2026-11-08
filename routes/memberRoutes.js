const express = require("express");
const router = express.Router();
const {
  registerMember,
  getAllMembers,
  getStats,
  getMemberById,
  updateMemberStatus,
  deleteMember,
} = require("../controllers/memberController");

router.post("/register", registerMember);
router.get("/", getAllMembers);
router.get("/stats", getStats);
router.get("/:id", getMemberById);
router.patch("/:id/status", updateMemberStatus);
router.delete("/:id", deleteMember);

module.exports = router;

