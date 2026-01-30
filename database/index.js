// Database module exports
const db = require('./db');
const TodosDB = require('./todos');
const SubscriptionsDB = require('./subscriptions');
const SettingsDB = require('./settings');

module.exports = {
  db,
  TodosDB,
  SubscriptionsDB,
  SettingsDB
};
