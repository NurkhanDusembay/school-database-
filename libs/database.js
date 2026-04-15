const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
    user: 'postgres',          // your DB username
    host: 'localhost',         // or your server IP
    database: 'demoDb', // your DB name
    password: '2302',
    port: 5432,
});

// Test connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } else {
        console.log('Connected to PostgreSQL!');
        release();
    }
});

module.exports = pool;