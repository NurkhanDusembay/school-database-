const { Pool } = require("pg");

function createPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
    };
  }

  return {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "school_system",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
  };
}

const pool = new Pool(createPoolConfig());

async function testConnection() {
  await pool.query("SELECT 1");
}

module.exports = {
  pool,
  testConnection
};
