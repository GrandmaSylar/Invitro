const { DataSource } = require("typeorm");
require("dotenv").config({ path: "./.env" });

const options = {
  type: "mssql",
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "1433"),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    cryptoCredentialsDetails: { rejectUnauthorized: false }
  }
};

const myDataSource = new DataSource(options);
myDataSource.initialize().then(async () => {
    console.log("Connected to MSSQL");
    const result = await myDataSource.query(`DELETE FROM dbo.Users WHERE email LIKE '%@lims.local'`);
    console.log("Rows deleted.", result);
    process.exit(0);
}).catch((error) => {
    console.error("Error connecting:", error);
    process.exit(1);
});
