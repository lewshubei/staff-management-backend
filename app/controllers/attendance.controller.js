const db = require("../models");
const Attendance = db.attendance;

// Check-in
exports.checkIn = async (req, res) => {
  try {
    const newRecord = await Attendance.create({
      userId: req.userId,
      checkInTime: new Date(),
    });
    res.status(200).send({ message: "Checked in", data: newRecord });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Check-out
exports.checkOut = async (req, res) => {
  try {
    const lastRecord = await Attendance.findOne({
      where: {
        userId: req.userId,
        checkOutTime: null,
      },
      order: [["checkInTime", "DESC"]],
    });

    if (!lastRecord) {
      return res.status(404).send({ message: "No active check-in found." });
    }

    const now = new Date();
    const checkInTime = lastRecord.checkInTime;
    const hoursWorked = (now - checkInTime) / (1000 * 60 * 60);

    lastRecord.checkOutTime = now;
    lastRecord.workingHours = hoursWorked;
    await lastRecord.save();

    res.status(200).send({ message: "Checked out", data: lastRecord });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get current user’s attendance history
exports.getUserAttendance = async (req, res) => {
  try {
    const records = await Attendance.findAll({
      where: { userId: req.userId },
      order: [["checkInTime", "DESC"]],
    });

    res.status(200).send(records);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
