const Session = require('./Session');
const PlayerPosition = require('./PlayerPosition');

// Definim les relacions aquí, un cop tots els models estan carregats
Session.hasMany(PlayerPosition, { foreignKey: 'SessionId', onDelete: 'CASCADE' });
PlayerPosition.belongsTo(Session, { foreignKey: 'SessionId' });

module.exports = {
    Session,
    PlayerPosition
};