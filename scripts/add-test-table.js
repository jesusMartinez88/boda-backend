import db from "../src/db.js";

// Wait briefly for db initialization to complete
setTimeout(() => {
  db.run(
    "INSERT INTO tables (name, capacity) VALUES ('test-capacity1', 1)",
    (err) => {
      if (err) console.error("insert error", err);
      else console.log("table created");
      process.exit(0);
    },
  );
}, 500);
