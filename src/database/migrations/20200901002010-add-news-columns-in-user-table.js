module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('clients', 'age', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }),
      queryInterface.addColumn('clients', 'phone', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('clients', 'address', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('clients', 'city', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('clients', 'state', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('clients', 'neighborhood', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('clients', 'gender', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('clients', 'birth_date', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('clients', 'age', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }),
      queryInterface.removeColumn('clients', 'phone', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.removeColumn('clients', 'address', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.removeColumn('clients', 'city', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.removeColumn('clients', 'state', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.removeColumn('clients', 'neighborhood', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.removeColumn('clients', 'gender', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.removeColumn('clients', 'birth_date', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
    ]);
  },
};
