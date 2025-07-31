module.exports = (sequelize, Sequelize) => {
  const Attendance = sequelize.define("attendance", {
    checkInTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    checkOutTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    workingHours: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
  });

  return Attendance;
};
