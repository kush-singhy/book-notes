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

CREATE TABLE book_notes (
	id SERIAL PRIMARY KEY,
    title TEXT,
    author TEXT,
    isbn TEXT,
	status BOOLEAN,
    read_date DATE,
    rating INTEGER,
    notes TEXT
)

INSERT INTO book_notes (title, author, isbn, status, read_date, rating, notes) VALUES
('Atomic Habits', 'James Clear', '9780735211292', TRUE, '2024-01-10', 5, 'An insightful book on building and breaking habits effectively. Clear and actionable strategies.'),
('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '9780062316097', TRUE, '2024-02-15', 4, 'Offers a fascinating view on human history and evolution, but some parts feel speculative.'),
('The Lean Startup', 'Eric Ries', '9780307887894', FALSE, NULL, NULL, NULL),
('Deep Work', 'Cal Newport', '9781455586691', TRUE, '2024-03-25', 5, 'Great techniques for focused work and productivity in a distracted world. Practical and thought-provoking.'),
('Clean Code', 'Robert C. Martin', '9780132350884', FALSE, NULL, NULL, NULL),
('The Subtle Art of Not Giving a F*ck', 'Mark Manson', '9780062457714', TRUE, '2024-04-12', 3, 'Interesting perspective on embracing life’s challenges but felt repetitive at times.'),
('The Power of Habit', 'Charles Duhigg', '9780812981605', TRUE, '2024-05-05', 4, 'Similar to Atomic Habits but dives deeper into the science behind habits and behavior change.'),
('Rich Dad Poor Dad', 'Robert T. Kiyosaki', '9781612680194', TRUE, '2024-06-18', 4, 'Engaging and thought-provoking ideas on personal finance and investing mindset.'),
('The Pragmatic Programmer', 'Andrew Hunt & David Thomas', '9780201616224', FALSE, NULL, NULL, NULL),
('How to Win Friends and Influence People', 'Dale Carnegie', '9780671027032', TRUE, '2024-07-22', 5, 'Timeless advice on communication and building relationships. Practical and still relevant today.');
