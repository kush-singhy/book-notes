CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT,
    author TEXT,
    isbn TEXT
)

CREATE TABLE notes (
    book_id INTEGER REFERENCES books(id) UNIQUE,
    status BOOLEAN,
    read_date DATE,
    rating INTEGER,
    notes TEXT
)

INSERT INTO books (title, author, isbn) 
VALUES 
('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565'),
('1984', 'George Orwell', '9780451524935'),
('To Kill a Mockingbird', 'Harper Lee', '9780061120084'),
('The Catcher in the Rye', 'J.D. Salinger', '9780316769488'),
('Pride and Prejudice', 'Jane Austen', '9780141439518');

INSERT INTO notes (book_id, status, read_date, rating, notes) 
VALUES 
(1, TRUE, '2023-01-15', 5, 'A captivating portrayal of the American Dream.'),
(2, TRUE, '2023-03-12', 4, 'A chilling dystopian tale that feels eerily relevant.'),
(5, TRUE, '2023-02-20', 4, 'A witty and engaging commentary on social expectations.');
