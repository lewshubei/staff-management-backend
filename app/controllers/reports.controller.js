const db = require("../models");
const User = db.user;
const Role = db.role;
const Attendance = db.attendance;
const { Op } = require("sequelize");

// Generate user statistics for admin dashboard
exports.getUserStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.count();

    // Get role-based counts using the junction table
    const adminRole = await Role.findOne({ where: { name: "admin" } });
    const employeeRole = await Role.findOne({ where: { name: "employee" } });
    const internRole = await Role.findOne({ where: { name: "intern" } });

    let adminCount = 0,
      employeeCount = 0,
      internCount = 0;

    if (adminRole) {
      adminCount = await User.count({
        include: [
          {
            model: Role,
            where: { id: adminRole.id },
            through: { attributes: [] },
          },
        ],
      });
    }

    if (employeeRole) {
      employeeCount = await User.count({
        include: [
          {
            model: Role,
            where: { id: employeeRole.id },
            through: { attributes: [] },
          },
        ],
      });
    }

    if (internRole) {
      internCount = await User.count({
        include: [
          {
            model: Role,
            where: { id: internRole.id },
            through: { attributes: [] },
          },
        ],
      });
    }

    // Get recent activity (users created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    });

    res.json({
      totalUsers,
      adminCount,
      employeeCount,
      internCount,
      recentActivity,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generate user report
exports.generateUserReport = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    // Build query conditions
    const whereCondition = {};
    if (dateFrom && dateTo) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(dateFrom), new Date(dateTo)],
      };
    }

    // Get users with roles
    const users = await User.findAll({
      where: whereCondition,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate summary
    const summary = {
      totalUsers: users.length,
      newUsersThisMonth: users.filter((u) => {
        const userDate = new Date(u.createdAt);
        const now = new Date();
        return (
          userDate.getMonth() === now.getMonth() &&
          userDate.getFullYear() === now.getFullYear()
        );
      }).length,
      activeUsers: users.length,
    };

    res.json({ users, summary });
  } catch (error) {
    console.error("Error generating user report:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generate registration report
exports.generateRegistrationReport = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const whereCondition = {};
    if (dateFrom && dateTo) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(dateFrom), new Date(dateTo)],
      };
    }

    const users = await User.findAll({
      where: whereCondition,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Group by registration date
    const registrationsByDate = users.reduce((acc, user) => {
      const date = user.createdAt.toDateString();
      if (!acc[date]) acc[date] = 0;
      acc[date]++;
      return acc;
    }, {});

    const summary = {
      totalRegistrations: users.length,
      registrationsByDate,
      averagePerDay:
        users.length / Object.keys(registrationsByDate).length || 0,
    };

    res.json({ users, summary });
  } catch (error) {
    console.error("Error generating registration report:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generate attendance report
exports.generateAttendanceReport = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const whereCondition = {};
    if (dateFrom && dateTo) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(dateFrom), new Date(dateTo)],
      };
    }

    const attendances = await Attendance.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ["username", "email"],
          include: [
            {
              model: Role,
              attributes: ["name"],
              through: { attributes: [] },
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate summary
    const totalRecords = attendances.length;
    const presentDays = attendances.filter((a) => a.checkInTime).length;
    const absentDays = totalRecords - presentDays;
    const totalWorkingHours = attendances.reduce(
      (sum, a) => sum + (a.workingHours || 0),
      0
    );
    const averageWorkingHours =
      totalRecords > 0 ? totalWorkingHours / totalRecords : 0;

    const summary = {
      totalRecords,
      presentDays,
      absentDays,
      averageWorkingHours: parseFloat(averageWorkingHours.toFixed(2)),
    };

    res.json({ attendances, summary });
  } catch (error) {
    console.error("Error generating attendance report:", error);
    res.status(500).json({ message: error.message });
  }
};

// Export users to CSV
exports.exportUsersCSV = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
    });

    // Convert to CSV format
    const csvHeader = [
      "ID",
      "Username",
      "Email",
      "Role",
      "Created Date",
      "Updated Date",
    ];
    const csvRows = users.map((user) => [
      user.id,
      user.username,
      user.email,
      user.Roles && user.Roles.length > 0 ? user.Roles[0].name : "No Role",
      user.createdAt ? user.createdAt.toISOString().split("T")[0] : "",
      user.updatedAt ? user.updatedAt.toISOString().split("T")[0] : "",
    ]);

    const csvData = [csvHeader, ...csvRows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=users_export.csv"
    );
    res.send(csvData);
  } catch (error) {
    console.error("Error exporting users to CSV:", error);
    res.status(500).json({ message: error.message });
  }
};

// Export attendance to CSV
exports.exportAttendanceCSV = async (req, res) => {
  try {
    const attendances = await Attendance.findAll({
      include: [
        {
          model: User,
          attributes: ["username", "email"],
        },
      ],
    });

    // Convert to CSV format
    const csvHeader = [
      "ID",
      "User",
      "Check In",
      "Check Out",
      "Working Hours",
      "Date",
    ];
    const csvRows = attendances.map((attendance) => [
      attendance.id,
      attendance.User ? attendance.User.username : "Unknown",
      attendance.checkInTime ? attendance.checkInTime.toISOString() : "",
      attendance.checkOutTime ? attendance.checkOutTime.toISOString() : "",
      attendance.workingHours || 0,
      attendance.createdAt
        ? attendance.createdAt.toISOString().split("T")[0]
        : "",
    ]);

    const csvData = [csvHeader, ...csvRows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance_export.csv"
    );
    res.send(csvData);
  } catch (error) {
    console.error("Error exporting attendance to CSV:", error);
    res.status(500).json({ message: error.message });
  }
};
