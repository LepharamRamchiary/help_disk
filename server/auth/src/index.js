import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = Number(process.env.PORT);

if (
  !process.env.AUTH_JWT_SECRET ||
  Buffer.byteLength(process.env.AUTH_JWT_SECRET) < 32
) {
  throw new Error(
    "AUTH_JWT_SECRET must be at least 32 bytes and match the support service",
  );
}

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Auth server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  });
