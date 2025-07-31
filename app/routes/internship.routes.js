const { authJwt } = require("../middleware");
const controller = require("../controllers/internship.controller");

module.exports = (app) => {
  const router = require("express").Router();

  // Only interns can access
  router.post(
    "/",
    [authJwt.verifyToken, authJwt.isIntern],
    controller.setPeriod
  );
  router.get(
    "/",
    [authJwt.verifyToken, authJwt.isIntern],
    controller.getPeriod
  );

  app.use("/api/internship", router);
};
