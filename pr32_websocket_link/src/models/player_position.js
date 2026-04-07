const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlayerPosition = sequelize.define('PlayerPosition', {
    playerPositionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    dxPosition: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dyPosition: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
});

module.exports = PlayerPosition;