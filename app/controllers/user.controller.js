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

// [ADMIN] Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          attributes: ["id", "name"],
          through: { attributes: [] }, // Don't include junction table data
        },
      ],
    });

    // Transform the response to make it easier for frontend
    const usersWithRoles = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username, // Add fullName if it exists
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.Roles, // This will be an array of role objects
      // Add a primary role for easier access
      primaryRole:
        user.Roles && user.Roles.length > 0 ? user.Roles[0].name : null,
    }));

    res.send(usersWithRoles);
  } catch (err) {
    console.error("Error getting all users:", err);
    res.status(500).send({ message: err.message });
  }
};

// [ADMIN] Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).send({ message: "Role not found" });
    }

    // Remove existing roles and set new role
    await user.setRoles([role]);

    res.send({ message: "User role updated successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// [ADMIN] Reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(password, 8);

    await User.update({ password: hashedPassword }, { where: { id: userId } });

    res.send({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// [ADMIN] Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    await User.destroy({ where: { id: userId } });

    res.send({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// [ADMIN] Get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ["id", "name"],
    });

    res.json(roles);
  } catch (error) {
    console.error("Error getting roles:", error);
    res.status(500).json({ message: error.message });
  }
};
