const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function (app) {
  // Common (all roles): Get own profile
  app.get("/api/user/profile", [authJwt.verifyToken], controller.getProfile);

  // Employee/Intern: Update own profile
  app.put("/api/user/profile", [authJwt.verifyToken], controller.updateProfile);

  // Admin: Get all users
  app.get(
    "/api/admin/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllUsers
  );
};
