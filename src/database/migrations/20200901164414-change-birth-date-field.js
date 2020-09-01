module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('clients', 'birth_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('clients', 'birth_date', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
