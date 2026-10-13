import mysql from "mysql2/promise";
import { DB_NAME } from "../constants.js";
import "dotenv/config";

let pool;

const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test the connection
    const connection = await pool.getConnection();

    console.log(
      `MySQL connected! Database: ${DB_NAME}, Host: ${process.env.DB_HOST || "localhost"}`,
    );

    connection.release();

    return pool;
  } catch (error) {
    console.error("MySQL connection failed:", error.message);

    if (pool) {
      await pool.end().catch(() => {});
      pool = undefined;
    }

    throw error;
  }
};

export { pool };
export default connectDB;
