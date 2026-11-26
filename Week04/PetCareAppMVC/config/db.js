const mysql = require('mysql2');

// MySQL connection pool
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '9700892',
  database: 'petcare'
});

module.exports = connection;
