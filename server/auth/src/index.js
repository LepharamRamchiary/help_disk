import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = Number(process.env.PORT || 5000);

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
