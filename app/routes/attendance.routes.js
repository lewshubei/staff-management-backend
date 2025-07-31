const { authJwt } = require("../middleware/");
const controller = require("../controllers/attendance.controller");

module.exports = function (app) {
  const router = require("express").Router();

  // All routes require login
  router.post("/check-in", [authJwt.verifyToken], controller.checkIn);
  router.post("/check-out", [authJwt.verifyToken], controller.checkOut);
  router.get(
    "/my-attendance",
    [authJwt.verifyToken],
    controller.getUserAttendance
  );

  app.use("/api/attendance", router);
};
