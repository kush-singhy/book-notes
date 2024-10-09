import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "library",
  password: "123456",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    const result = await db.query(
        "SELECT * FROM books"
    );
    const books = result.rows;
    console.log(books);
    res.render("index.ejs");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});
  