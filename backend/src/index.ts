import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db';
import initDatabase from './db/init';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'Kuchupuchu';
const app = express();

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION', error);
    // Don't exit the process, log error and continue
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION', reason);
    // Don't exit the process, log error and continue
});

app.use(express.json());

// Add CORS middleware for frontend connectivity
app.use((req, res, next)  => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.status(200).json({});
        return;
    }
    next();
});

// Define routes
app.get("/", (req, res) => {
    res.json({ message: "backend up and running" });
});

app.post("/signup", async (req, res): Promise<void> => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            res.status(400).json({ error: "Username and password are required" });
            return;
        }

        // Check if user already exists
        const userExists = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (userExists.rows.length > 0) {
            res.status(409).json({ error: "User already exists" });
            return;
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user
        const newUser = await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
            [username, hashedPassword]
        );

        res.status(201).json({
            message: "User created successfully",
            user: newUser.rows[0]
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/login", async (req, res): Promise<void> => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ message: "Enter both username and password" });
            return;
        }

        const userResult = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (userResult.rows.length === 0) {
            res.status(401).json({ message: "Username doesn't exist" });
            return;
        }

        const user = userResult.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            res.status(401).json({ message: "Invalid password" });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/users", async (req, res) => {
    try {
        const users = await pool.query("SELECT id, username, created_at FROM users");
        res.status(200).json({
            message: "Data received successfully",
            users: users.rows
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/contents' , async(req , res) => {

    const { content_type , link , title , user_id } = req.body;

    try{
        if( !content_type || !link || !title || !user_id ){
            res.status(401).json({message : "Please enter all the fields"})
            return;
        }

        const validTypes = ['image', 'video', 'article', 'audio'];
        if (!validTypes.includes(content_type)) {
            res.status(400).json({message: `Content type must be one of: ${validTypes.join(', ')}`});
            return;
        }
        const query = await pool.query("INSERT INTO contents (content_type , link , title , user_id) VALUES ($1 , $2 , $3 , $4) RETURNING id , user_id ,title", [content_type , link , title , user_id])

        res.status(200).json({
            message : "Note Created Successfuly",
            content : query.rows[0]
        })
    }catch(err){
        console.log(err)
    }
})

app.get("/contents/:id" , async(req , res) => {
    const user_id = req.params.id;


    try{
        const query = await pool.query(
            "SELECT * FROM contents WHERE user_id = $1" , [user_id]
        );

        res.status(200).json({
            contents : query.rows
        })

    }catch(err){
        console.log(err);
        res.status(500).json({message : "Internal Sever Error"})
    }
})
// Initialize database and start server properly
async function startServer() {
    try {
        // Initialize database first
        await initDatabase();

        // Start server after database is ready
        const server = app.listen(3001, () => {
            console.log("Backend running on port 3001");
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('Server error:', error);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('Process terminated');
            });
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        // Don't exit the process, log error and continue
    }
}

// Start the server properly
startServer();

// Keep process alive in Docker
if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode - keeping process alive');
    // This empty interval prevents Node.js from exiting
    setInterval(() => { }, 1000);
}