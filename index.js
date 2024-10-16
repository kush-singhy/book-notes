import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import https from 'https';
import { stat } from "fs";

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

// async function getBookCover(isbn) {
//     console.log(isbn);
//     const url = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

//     try {
//         const response = await axios.get(url, { httpsAgent: agent });
//         const image = response.data;
//         console.log("Image: " + image);
//         return image;
//     } catch(error) {
//         console.error('Error fetching book cover:', error.message);
//         return null;
//     }
// }

app.get("/", async (req, res) => {
    try {
        const result = await db.query(
            `SELECT *
            FROM book_notes
            WHERE status = true`
        );
        const books = result.rows;
        // books.forEach((book) => {
        //     const bookISBN = book.isbn;
        //     book.isbn = `https://covers.openlibrary.org/b/isbn/${bookISBN}-M.jpg`
        // })

        // const cover = await getBookCover('9781451648539');
        // console.log('Cover: ' + cover);
        // const url = `https://covers.openlibrary.org/b/isbn/9781451648539-M.jpg`;

        // try {
        //     const response = await axios.get("https://covers.openlibrary.org/b/isbn/9781451648539-M.jpg", { httpsAgent: agent });
        //     const image = response.data;
        //     console.log("Image: " + image);
        //     res.render("index.ejs", { books, formatPostgresDate });
        // } catch(error) {
        //     console.error('Error fetching book cover:', error.message);
        // }

        res.render("index.ejs", { books, formatPostgresDate });
        
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
        const book = result.rows[0];
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
        console.log('here');
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
            res.redirect("/view-notes" + bookId);
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
        console.log(book);
        res.render("editbook.ejs", { book, formatPostgresDate });

    } catch (error) {
        console.error(error.message);
        res.redirect("/");
    }
});

app.post("/edit/:id", async (req, res) => {
    console.log(req.body);
})


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});

