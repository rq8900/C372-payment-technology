const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '9700892',
  database: 'petcare'
});

module.exports = connection;
