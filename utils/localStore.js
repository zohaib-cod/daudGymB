const fs = require("fs");
const path = require("path");

// Use /tmp on Vercel serverless environment because root filesystem is read-only
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "data")
  : path.join(__dirname, "..", "data");

const DATA_FILE = path.join(DATA_DIR, "members.json");
const SEED_FILE = path.join(__dirname, "..", "data", "members.json");

function ensureFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      if (fs.existsSync(SEED_FILE)) {
        const initial = fs.readFileSync(SEED_FILE, "utf-8");
        fs.writeFileSync(DATA_FILE, initial, "utf-8");
      } else {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
      }
    }
  } catch (err) {
    console.warn("Storage ensure warning:", err.message);
  }
}

function getLocalMembers() {
  try {
    ensureFile();
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Error reading local members:", err);
    return [];
  }
}

function saveLocalMember(member) {
  try {
    ensureFile();
    const list = getLocalMembers();
    const existingIndex = list.findIndex(
      (m) => m._id === member._id || m.membershipId === member.membershipId
    );
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...member, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({
        ...member,
        createdAt: member.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
    return member;
  } catch (err) {
    console.error("Error saving local member:", err);
    return member;
  }
}

function updateLocalMemberStatus(id, status) {
  try {
    ensureFile();
    const list = getLocalMembers();
    const member = list.find((m) => m._id === id || m.membershipId === id);
    if (member) {
      member.status = status;
      member.updatedAt = new Date().toISOString();
      fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
      return member;
    }
    return null;
  } catch (err) {
    console.error("Error updating local member status:", err);
    return null;
  }
}

function deleteLocalMember(id) {
  try {
    ensureFile();
    const list = getLocalMembers();
    const filtered = list.filter((m) => m._id !== id && m.membershipId !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error deleting local member:", err);
    return false;
  }
}

module.exports = {
  getLocalMembers,
  saveLocalMember,
  updateLocalMemberStatus,
  deleteLocalMember,
};
