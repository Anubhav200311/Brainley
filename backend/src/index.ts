import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db';
import initDatabase from './db/init';

const app = express();

app.use(express.json());

// Initialize database tables
initDatabase();

app.get("/", (req, res) => {
    res.json({message: "backend up and running"});
});

app.post("/signup", async(req, res):Promise<void> => {
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
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at",
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
app.get("/users" , async(req , res) : Promise<void> => {
    
    try{
        const users = await pool.query(
            "SELECT * FROM users"
        )

        res.status(201).json({message : "Data recieved successfully" , 
            users : users
        });
    }catch(err){
        console.log(err);
        res.status(500).json({message : "Internal server error"});
    }

})
app.listen(3001, () => {
    console.log("Backend running on port 3001");
});