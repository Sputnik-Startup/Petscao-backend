module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('clients', 'cep', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('clients', 'cep');
  },
};
