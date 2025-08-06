const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;

// Sync database
db.sequelize.sync().then(() => {
  console.log("Database synced.");
  initial(); // Seed default roles
});

function initial() {
  Role.count().then((count) => {
    if (count === 0) {
      Role.create({ id: 1, name: "admin" });
      Role.create({ id: 2, name: "employee" });
      Role.create({ id: 3, name: "intern" });
      console.log("Seeded roles: admin, employee, intern");
    }
  });
}

// Routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

require("./app/routes/attendance.routes")(app);

app.use(
  cors({
    origin: "http://localhost:4200", // allow only frontend origin
    credentials: true,
  })
);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
