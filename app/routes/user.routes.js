const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Admin-only user management routes
  app.get(
    "/api/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllUsers
  );

  // Get user by ID - ADD THIS ROUTE
  app.get("/api/users/:userId", [authJwt.verifyToken], controller.getUserById);

  // Update user (admin only for other users, anyone for own profile)
  app.put("/api/users/:userId", [authJwt.verifyToken], controller.updateUser);

  app.delete(
    "/api/users/:userId",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.deleteUser
  );

  app.get(
    "/api/roles",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllRoles
  );

  app.get(
    "/api/reports/stats",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getUserStats
  );

  // Create new user (admin only)
  app.post(
    "/api/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.createUser
  );
};
