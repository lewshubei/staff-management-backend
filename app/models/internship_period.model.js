module.exports = (sequelize, DataTypes) => {
  const InternshipPeriod = sequelize.define("internship_period", {
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  });

  return InternshipPeriod;
};
