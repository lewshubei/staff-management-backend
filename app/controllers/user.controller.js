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

// [ALL] Update own profile
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
    console.log("BACKEND - Fetching all users with roles");

    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "email",
        "fullName",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: Role,
          as: "roles", // Make sure this matches your model association
          attributes: ["id", "name"],
          through: { attributes: [] }, // Exclude junction table attributes
        },
      ],
      order: [["createdAt", "DESC"]], // Most recent first
    });

    console.log("BACKEND - Found users:", users.length);
    console.log(
      "BACKEND - Sample user with roles:",
      JSON.stringify(users[0], null, 2)
    );

    res.status(200).json(users);
  } catch (error) {
    console.error("BACKEND - Error fetching users:", error);
    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
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

exports.getUserStats = async (req, res) => {
  try {
    console.log("🔍 BACKEND - Fetching user statistics");

    // Get total users count
    const totalUsers = await User.count();

    // Get users with their roles - FIXED: Added 'as' alias
    const usersWithRoles = await User.findAll({
      include: [
        {
          model: Role,
          as: "roles", // This was missing and causing the error
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
    });

    // Count users by role
    let adminCount = 0;
    let employeeCount = 0;
    let internCount = 0;

    usersWithRoles.forEach((user) => {
      const userRoles = user.roles || [];
      if (
        userRoles.some(
          (role) => role.name === "ROLE_ADMIN" || role.name === "admin"
        )
      ) {
        adminCount++;
      } else if (
        userRoles.some(
          (role) => role.name === "ROLE_EMPLOYEE" || role.name === "employee"
        )
      ) {
        employeeCount++;
      } else if (
        userRoles.some(
          (role) => role.name === "ROLE_INTERN" || role.name === "intern"
        )
      ) {
        internCount++;
      }
    });

    // Calculate recent activity (users created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await User.count({
      where: {
        createdAt: {
          [require("sequelize").Op.gte]: sevenDaysAgo,
        },
      },
    });

    const stats = {
      totalUsers,
      adminCount,
      employeeCount,
      internCount,
      recentActivity,
    };

    console.log("BACKEND - User stats:", stats);
    res.status(200).json(stats);
  } catch (error) {
    console.error("BACKEND - Error fetching user stats:", error);
    res.status(500).json({
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
};
