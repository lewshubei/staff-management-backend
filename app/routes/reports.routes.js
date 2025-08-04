const { authJwt } = require("../middleware");
const controller = require("../controllers/reports.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Dashboard statistics - Admin only
  app.get(
    "/api/reports/stats",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getUserStats
  );

  // User reports - Admin only
  app.get(
    "/api/reports/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.generateUserReport
  );

  // Registration reports - Admin only
  app.get(
    "/api/reports/registrations",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.generateRegistrationReport
  );

  // Attendance reports - Admin only
  app.get(
    "/api/reports/attendance",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.generateAttendanceReport
  );

  // Export endpoints - Admin only
  app.get(
    "/api/export/users/csv",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.exportUsersCSV
  );

  app.get(
    "/api/export/attendance/csv",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.exportAttendanceCSV
  );
};
