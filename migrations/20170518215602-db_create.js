"use strict";

module.exports = {
    up: function (queryInterface, Sequelize) {
      /*
       Add altering commands here.
       Return a promise to correctly handle asynchronicity.

       Example:
       return queryInterface.createTable('users', { id: Sequelize.INTEGER });
       */
        return queryInterface.createTable("users", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            username: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            first_name: {
                type: Sequelize.STRING,
                default: null
            },
            last_name: {
                type: Sequelize.STRING,
                default: null
            },
            display_name: {
                type: Sequelize.STRING,
                default: null
            },
            location: {
                type: Sequelize.STRING,
                default: null
            }
        });
    },

    down: function (queryInterface, Sequelize) {
        return queryInterface.dropTable("users");
    }
};
