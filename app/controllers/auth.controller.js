const db = require("../models");
const config = process.env;
const User = db.user;
const Role = db.role;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
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

    // Set roles
    if (req.body.roles) {
      const roles = await Role.findAll({
        where: {
          name: req.body.roles,
        },
      });
      await user.setRoles(roles);
    } else {
      // Default to 'employee' if no role provided
      const role = await Role.findOne({ where: { name: "employee" } });
      await user.setRoles([role]);
    }

    res.send({ message: "User registered successfully!" });
  } catch (err) {
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
