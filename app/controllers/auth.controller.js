const db = require("../models");
const config = process.env;
const User = db.user;
const Role = db.role;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  console.log("🚀 SIGNUP ENDPOINT HIT!"); // Add this
  console.log("📋 Full request body:", req.body); // Add this

  try {
    // Create user
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      fullName: req.body.fullName || null,
      internshipStart: req.body.internshipStart || null,
      internshipEnd: req.body.internshipEnd || null,
    });

    // Set roles - UPDATED to handle both roleId and roles
    if (req.body.roles) {
      console.log("🔍 BACKEND - Processing roles array:", req.body.roles);
      // Handle array of role names (existing functionality)
      const roles = await Role.findAll({
        where: {
          name: req.body.roles,
        },
      });
      await user.setRoles(roles);
    } else if (req.body.roleId) {
      console.log("🔍 BACKEND - Received roleId:", req.body.roleId); // Make sure this is here
      const role = await Role.findOne({ where: { id: req.body.roleId } });
      if (role) {
        console.log("✅ BACKEND - Found role:", role.name);
        await user.setRoles([role]);
      } else {
        console.log("❌ BACKEND - Role not found with ID:", req.body.roleId);
      }
    } else {
      console.log("⚠️ BACKEND - No role specified");
    }

    res.send({ message: "User registered successfully!" });
  } catch (err) {
    console.error("❌ BACKEND Error:", err);
    res.status(500).send({ message: err.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not Found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    const token = jwt.sign({ id: user.id }, config.JWT_SECRET, {
      expiresIn: 86400, // 24 hours
    });

    const roles = await user.getRoles();
    const roleNames = roles.map((role) => "ROLE_" + role.name.toUpperCase());

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: roleNames,
      accessToken: token,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
