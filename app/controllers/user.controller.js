const db = require("../models");
const User = db.user;
const Role = db.role;
const bcrypt = require("bcryptjs");

// [ALL] View own profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, attributes: ["name"], through: { attributes: [] } },
      ],
    });

    if (!user) return res.status(404).send({ message: "User not found" });

    res.send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// [EMPLOYEE/INTERN] Update own profile
exports.updateProfile = async (req, res) => {
  try {
    await User.update(
      {
        fullName: req.body.fullName,
        internshipStart: req.body.internshipStart || null,
        internshipEnd: req.body.internshipEnd || null,
      },
      { where: { id: req.userId } }
    );

    res.send({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// [ADMIN] Get all users (optional)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, attributes: ["name"], through: { attributes: [] } },
      ],
    });

    res.send(users);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
