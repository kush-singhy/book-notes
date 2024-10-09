import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import https from 'https';

const app = express();
const port = 3000;
const agent = new https.Agent({  
    rejectUnauthorized: false
});

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
    try {
        const result = await db.query(
            `SELECT books.title, books.author, books.isbn, notes.read_date, notes.rating, notes.status
            FROM books JOIN notes 
            ON books.id = notes.book_id`
        );
        const books = result.rows;
        
        books.forEach((book) => {
            const bookISBN = book.isbn;
            book.isbn = `https://covers.openlibrary.org/b/isbn/${bookISBN}-M.jpg`
        })
        
        res.render("index.ejs", { books, formatPostgresDate });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Error fetching books');
    }
});

app.get("/add", (req, res) => {
    res.render("addbook.ejs");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});

function formatPostgresDate(pgDate) {
    const date = new Date(pgDate);

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
} 