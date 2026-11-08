const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    membershipId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, "Father name is required"],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    idCardNo: {
      type: String,
      required: [true, "ID card / CNIC number is required"],
      trim: true,
    },
    picture: {
      type: String,
      required: [true, "Member picture is required"],
    },
    picturePublicId: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Member || mongoose.model("Member", MemberSchema);

