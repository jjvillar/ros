const mysql = require('mysql');
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'test',
    password: 'password',
    database: 'mydatabase'
});
connection.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    const username = process.argv[2];
    const password = process.argv[3];
    const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    console.log(sql);
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }
        if (results.length > 0) {
            console.log('Login successful!');
            console.log(results);
        } else {
            console.log('Invalid username or password.');
        }
    });
});