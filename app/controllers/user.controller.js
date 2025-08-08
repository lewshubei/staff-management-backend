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

// [ADMIN] Update user - This method can also be used for profile updates
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      username,
      email,
      fullName,
      roleId,
      password,
      internshipStart,
      internshipEnd,
    } = req.body;

    console.log("BACKEND - === UPDATE USER DEBUG ===");
    console.log("BACKEND - Target user ID:", userId);
    console.log("BACKEND - Current user ID:", req.userId);
    console.log("BACKEND - Current user roles:", req.userRoles);

    // Check if user can update this profile (either admin or own profile)
    const isAdmin = req.userRoles && req.userRoles.includes("admin");
    const isOwnProfile = parseInt(req.userId) === parseInt(userId);

    console.log("BACKEND - Is Admin:", isAdmin);
    console.log("BACKEND - Is Own Profile:", isOwnProfile);

    if (!isAdmin && !isOwnProfile) {
      console.log("BACKEND - ACCESS DENIED");
      return res.status(403).json({
        message: "Access denied. You can only update your own profile.",
      });
    }

    console.log("BACKEND - ACCESS GRANTED");

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (fullName !== undefined) updateData.fullName = fullName;

    // Add internship dates directly to the users table
    if (internshipStart) updateData.internshipStart = internshipStart;
    if (internshipEnd) updateData.internshipEnd = internshipEnd;

    // Add password if provided
    if (password) {
      updateData.password = bcrypt.hashSync(password, 8);
    }

    console.log("BACKEND - Update data:", updateData);

    // Update user (this will now include internship fields)
    await user.update(updateData);

    // Update role if provided (admin only)
    if (roleId && isAdmin) {
      const role = await Role.findByPk(roleId);
      if (role) {
        await user.setRoles([role]);
      }
    }

    // Get updated user for response (remove internshipPeriod include)
    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
        // Remove the internshipPeriod include since model is deleted
      ],
      attributes: { exclude: ["password"] },
    });

    console.log("BACKEND - Updated user:", {
      id: updatedUser.id,
      internshipStart: updatedUser.internshipStart,
      internshipEnd: updatedUser.internshipEnd,
    });

    res.status(200).json({
      message: "User updated successfully!",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        roles: updatedUser.roles,
        internshipStart: updatedUser.internshipStart, // Direct from users table
        internshipEnd: updatedUser.internshipEnd, // Direct from users table
      },
    });
  } catch (error) {
    console.error("BACKEND - Error updating user:", error);
    res.status(500).json({
      message: "Error updating user",
      error: error.message,
    });
  }
};

// updateProfile as a simple wrapper for backward compatibility
exports.updateProfile = async (req, res) => {
  try {
    // Set userId from token for profile updates
    req.params.userId = req.userId;

    // Call the main updateUser method
    await exports.updateUser(req, res);
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
    console.log("BACKEND - Fetching user statistics");

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

// [ADMIN] Create new user
exports.createUser = async (req, res) => {
  try {
    console.log("BACKEND - Creating new user:", req.body);

    const { username, email, password, roleId, fullName } = req.body;

    // Validate required fields
    if (!username || !email || !password || !roleId) {
      return res.status(400).json({
        message: "All fields are required: username, email, password, roleId",
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({
      where: { username: username },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists!",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({
      where: { email: email },
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists!",
      });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Create user
    const user = await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      fullName: fullName || username,
    });

    // Assign role to user
    const role = await Role.findByPk(roleId);
    if (!role) {
      // If role not found, delete the created user and return error
      await User.destroy({ where: { id: user.id } });
      return res.status(400).json({
        message: "Invalid role ID",
      });
    }

    await user.setRoles([role]);

    console.log("BACKEND - User created successfully:", user.username);

    res.status(201).json({
      message: "User created successfully!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roleId: roleId,
      },
    });
  } catch (error) {
    console.error("BACKEND - Error creating user:", error);
    res.status(500).json({
      message: "Error creating user",
      error: error.message,
    });
  }
};
exports.getUserById = async (req, res) => {
  try {
    // extract userId from request parameters
    const userId = req.params.userId;
    //use to debug at the backend console
    console.log("BACKEND - Getting user by ID:", userId);
    // use to create the query
    // SELECT users.*, roles.id, roles.name FROM users
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // create user response object to the frontend
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      internshipStart: user.internshipStart,
      internshipEnd: user.internshipEnd,
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error("BACKEND - Error getting user:", error);
    res.status(500).json({
      message: "Error retrieving user",
      error: error.message,
    });
  }
};
