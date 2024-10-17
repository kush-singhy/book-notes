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

const coverCache = new Map();

async function fetchBookCover(book) {
    if (coverCache.has(book.isbn)) {
        book.cover = coverCache.get(book.isbn);
    } else {
        try {
            const response = await axios.get('https://bookcover.longitood.com/bookcover/' + book.isbn);
            const coverUrl = response.data.url;
            coverCache.set(book.isbn, coverUrl);
            book.cover = coverUrl;
        } catch (error) {
            console.error(`Error fetching cover for ISBN ${book.isbn}:`, error.message);
            book.cover = '/assets/gradient.jpg'; 
        }
    }
    return book;
}

app.get("/", (req, res) => {
    res.redirect("/latest")
});

app.get("/latest", async (req, res) => {
    try {
        const result = await db.query(
            `SELECT *
            FROM book_notes
            WHERE status = true
            ORDER BY read_date DESC`
        );
        const books = result.rows;
        const sort = 'date';
        await Promise.all(books.map(fetchBookCover));

        res.render("index.ejs", { books, sort, formatPostgresDate });
        
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Error fetching books');
    }
});

app.get("/highest-rating", async (req, res) => {
    try {
        const result = await db.query(
            `SELECT *
            FROM book_notes
            WHERE status = true
            ORDER BY rating DESC`
        );
        const books = result.rows;
        const sort = 'rating';
        await Promise.all(books.map(fetchBookCover));

        res.render("index.ejs", { books, sort, formatPostgresDate });
        
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Error fetching books');
    }
});

app.get("/title", async (req, res) => {
    try {
        const result = await db.query(
            `SELECT *
            FROM book_notes
            WHERE status = true
            ORDER BY title`
        );
        const books = result.rows;
        const sort = 'title';
        await Promise.all(books.map(fetchBookCover));

        res.render("index.ejs", { books, sort, formatPostgresDate });
        
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Error fetching books');
    }
});

app.get("/wishlist", async (req, res) => {
    try {
        const result = await db.query(
            `SELECT *
            FROM book_notes
            WHERE status = false`
        );
        const books = result.rows;
        await Promise.all(books.map(fetchBookCover));

        res.render("index.ejs", { books, formatPostgresDate });
        
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Error fetching books');
    }
});


app.get("/view-notes/:id", async (req, res) => {
    const bookId = parseInt(req.params.id);
    try {
        const result = await db.query(
            `SELECT *
            FROM book_notes
            WHERE id = $1`,
            [bookId]
        );
        let book = result.rows[0];
        book = await fetchBookCover(book);
        res.render("booknotes.ejs", { book, formatPostgresDate });
    } catch (error) {
        console.error("Error: ", error.message);
        res.redirect("/");
    }
    
});

app.get("/add", (req, res) => {
    res.render("addbook.ejs");
});

app.post("/search", async (req, res) => {
    const input = req.body.book_name;
    console.log('User Input: ' + input);
    const searchURL = "https://openlibrary.org/search.json?q=" + input
    try {
        const response = await axios.get(searchURL);
        console.log('Response: ' + response.data);
        res.sendStatus(200);
    } catch(error) {
        console.error(error.message);
        res.redirect("/add");
    }
})

app.post("/add", async (req, res) => {
    const { title, author, isbn, date, rating, notes } = req.body;
    const status = req.body['read-status'];

    try {
        if (status === 'yes') {
            const result = await db.query(
                `INSERT INTO book_notes (title, author, isbn, status, read_date, rating, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id`,
                [title, author, isbn, true, date, rating, notes]
            )
            const bookId = result.rows[0].id;
            res.redirect("/view-notes/" + bookId);
        } else if (status === 'no') {
            const result = await db.query(
                `INSERT INTO book_notes (title, author, isbn, status)
                VALUES ($1, $2, $3, $4)
                RETURNING id`,
                [title, author, isbn, false]
            )
            const bookId = result.rows[0].id;
            res.redirect("/view-notes/" + bookId);
        }
    } catch (error) {
        console.error(error.message);
        res.redirect("/add");
    }
        
});

app.get("/edit/:id", async (req, res) => {
    const bookId = parseInt(req.params.id);
    try {
        const result = await db.query(
            `SELECT *
            FROM book_notes
            WHERE id = $1`,
            [bookId]
        );
        const book = result.rows[0];
        res.render("editbook.ejs", { book, formatPostgresDate });

    } catch (error) {
        console.error(error.message);
        res.redirect("/");
    }
});

app.post("/edit/:id", async (req, res) => {
    const bookId = parseInt(req.params.id);

    const { title, author, isbn, date, rating, notes } = req.body;
    const status = req.body['read-status'];

    try {
        if (status === 'yes') {
            const result = await db.query(
                `UPDATE book_notes
                SET title = $1, author = $2, isbn = $3, status = $4, read_date = $5, rating = $6, notes = $7
                WHERE id = $8`,
                [title, author, isbn, true, date, rating, notes, bookId]
            )
            res.redirect("/view-notes/" + bookId);
        } else if (status === 'no') {
            const result = await db.query(
                `UPDATE book_notes
                SET title = $1, author = $2, isbn = $3, status = $4, read_date = $5, rating = $6, notes = $7
                WHERE id = $8`,
                [title, author, isbn, false, null, null, null, bookId]
            )
            res.redirect("/view-notes/" + bookId);
        }
    } catch (error) {
        console.error(error.message);
        res.redirect("/edit/" + bookId);
    }
});

app.get("/delete/:id", (req, res) => {
    const bookId = parseInt(req.params.id);

    try {
        const result = db.query(
            `DELETE FROM book_notes
            WHERE id = $1`,
            [bookId]
        )
        res.redirect("/");
    } catch (error) {
        console.error(error.message);
        res.redirect("/view-notes/" + bookId);
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});

