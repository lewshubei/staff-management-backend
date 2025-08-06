const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load models
db.user = require("./user.model.js")(sequelize, Sequelize);
db.role = require("./role.model.js")(sequelize, Sequelize);

db.role.belongsToMany(db.user, {
  through: "user_roles",
  as: "users", // Add alias for users
  foreignKey: "roleId",
  otherKey: "userId",
});
db.user.belongsToMany(db.role, {
  through: "user_roles",
  as: "roles", // Add alias for roles - this is what your controller expects
  foreignKey: "userId",
  otherKey: "roleId",
});
db.attendance = require("./attendance.model.js")(sequelize, Sequelize);

// One user has many attendance records
db.user.hasMany(db.attendance, { as: "attendances" });
db.attendance.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

module.exports = db;
