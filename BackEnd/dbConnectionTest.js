const sql = require('mssql');
const config = require('./dbConfig');

async function testConnection() {
    try {
        await sql.connect(config);
        console.log("✔️ Connected successfully");

        const result = await sql.query`SELECT GETDATE() AS currentTime`;

        console.log(`Server Time: ${result.recordset[0].currentTime}`);
    }
    catch (err) {
        console.error(`Connection failed: ${err}`);
    }
    finally {
        await sql.close();
    }
}

testConnection();
