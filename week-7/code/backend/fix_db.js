const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE alerts ADD COLUMN source TEXT DEFAULT 'Rule-Based';", (err) => {
        if(err) console.log("Alter err:", err.message);
        else console.log("Added source column successfully!");
    });
});
db.close();
