const db = require("../models");
const InternshipPeriod = db.internshipPeriod;

exports.setPeriod = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.userId;

    const period = await InternshipPeriod.create({
      userId,
      startDate,
      endDate,
    });
    res.status(201).send({ message: "Internship period set", period });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.getPeriod = async (req, res) => {
  try {
    const userId = req.userId;

    const period = await InternshipPeriod.findOne({ where: { userId } });

    if (!period)
      return res.status(404).send({ message: "No internship period found" });

    const today = new Date();
    const endDate = new Date(period.endDate);
    const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    res.status(200).send({
      startDate: period.startDate,
      endDate: period.endDate,
      remainingDays,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
