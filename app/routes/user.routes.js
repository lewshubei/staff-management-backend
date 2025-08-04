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

  // Profile routes
  app.get("/api/user/profile", [authJwt.verifyToken], controller.getProfile);
  app.put("/api/user/profile", [authJwt.verifyToken], controller.updateProfile);

  // Admin-only user management routes
  app.get(
    "/api/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllUsers
  );

  app.put(
    "/api/users/:userId/role",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.updateUserRole
  );

  app.put(
    "/api/users/:userId/reset-password",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.resetUserPassword
  );

  app.delete(
    "/api/users/:userId",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.deleteUser
  );

  // Add this route
  app.get(
    "/api/roles",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllRoles
  );
};
