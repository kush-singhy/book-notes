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
            `SELECT books.id, books.title, books.author, books.isbn, notes.read_date, notes.rating, notes.status
            FROM books JOIN notes 
            ON books.id = notes.book_id`
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
            FROM books
            LEFT JOIN notes ON books.id = notes.book_id
            WHERE notes.book_id IS NULL;`
        );
        const books = result.rows;

        res.render("index.ejs", { books, formatPostgresDate });
        
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Error fetching books');
    }
})

app.get("/addbook", (req, res) => {
    res.render("addbook.ejs");
});

app.get("/view-notes/:id", async (req, res) => {
    const bookId = parseInt(req.params.id);
    let status = false;
    try {
        const result = await db.query(
            `SELECT notes.status
            FROM books
            JOIN notes
            ON books.id = notes.book_id
            WHERE id = $1`,
            [bookId]
        );
        status = (result.rows.length > 0) ? true : false;
        console.log(status);
    } catch (error) {
        console.error('Error: ', error.message);
    }

    if (status) {
        try {
            const result = await db.query(
                `SELECT *
                FROM books JOIN notes
                ON books.id = notes.book_id
                WHERE books.id = $1`,
                [bookId]
            )
            const book = result.rows[0];
            res.render("booknotes.ejs", { book, formatPostgresDate });
        } catch (error) {
            console.error("Error: ", error.message);
            res.redirect("/");
        }
    } else {
        try {
            const result = await db.query(
                `SELECT *
                FROM books
                LEFT JOIN notes ON books.id = notes.book_id
                WHERE notes.book_id IS NULL
				AND books.id = $1`,
                [bookId]
            );
            const book = result.rows[0];
            res.render("booknotes.ejs", { book, formatPostgresDate });

        } catch (error) {
            console.error("Error: ", error.message);
            res.redirect("/");
        }
    }

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
    console.log(status);

    try {
        const response = await db.query(
            `INSERT INTO books (title, author, isbn)
            VALUES ($1, $2, $3)
            RETURNING id`,
            [title, author, isbn]
        )
        const bookId = response.rows[0].id;
        
        if (status === 'yes') {
            try {
                await db.query(
                    `INSERT INTO notes
                    VALUES ($1, $2, $3, $4, $5)`,
                    [bookId, true, date, rating, notes]
                )

                res.redirect("/");

            } catch (error) {
                console.error(error.message);
                res.redirect("/addbook");
            }
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(error.message);
        res.redirect("/addbook");
    }
})


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});

