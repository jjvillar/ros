const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydatabase'
});
connection.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    const username = 'userInput';
    const password = 'userPassword';
    const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }
        if (results.length > 0) {
            console.log('Login successful!');
        } else {
            console.log('Invalid username or password.');
        }
    });
});