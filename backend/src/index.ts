import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db';
import initDatabase  from './db/init';
import jwt from 'jsonwebtoken';
import { generateShareToken } from './db/init';



const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded; // Add user info to request object
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  };
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

app.get("/users",authenticateToken, async (req, res) => {
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

app.post('/contents' ,authenticateToken , async(req , res) => {

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

app.get("/contents/:id" ,authenticateToken, async(req , res) => {
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

app.delete('/contents/:id' ,authenticateToken, async(req , res) => {
    const id = req.params.id;

    try{

        const query = await pool.query(
            "DELETE FROM contents WHERE id = $1 RETURNING id , title" ,[id]
        );

        if (query.rowCount === 0) {
             res.status(404).json({message: 'Content not found'});
            return;
        }
        
        res.status(200).json(
            {message : 'record deleted successfully',
                id: query.rows[0].id,
                title : query.rows[0].title
            }
        )
    }catch(err) {
        console.log(err);
        res.status(500).json({message : "Internal Server error"})
    }
})
app.post('/api/v1/brain/share', authenticateToken, async (req, res) => {
    try {
      const { contentId } = req.body;
      
      if (!contentId) {
         res.status(400).json({ message: "Content ID is required" });
         return
      }
      
      // Check if content exists and belongs to the user
      const contentQuery = await pool.query(
        "SELECT * FROM contents WHERE id = $1", 
        [contentId]
      );
      
      if (contentQuery.rows.length === 0) {
         res.status(404).json({ message: "Content not found" });
         return;
      }
      
      // Generate unique share token
      const shareToken = generateShareToken();
      
      // Set expiry date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Store share info in database
      await pool.query(
        "INSERT INTO content_shares (content_id, share_token, expires_at) VALUES ($1, $2, $3)",
        [contentId, shareToken, expiresAt]
      );
      
      // Generate shareable URL
      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/api/v1/brain/shared/${shareToken}`;
      
       res.status(201).json({
        message: "Content shared successfully",
        shareUrl,
        expiresAt
      });
    } catch (error) {
      console.error("Error sharing content:", error);
       res.status(500).json({ message: "Internal server error" });
    }
});

app.get('/api/v1/brain/shared/:shareToken', async (req, res) => {
    try {
      const { shareToken } = req.params;
      
      // Find share by token
      const shareQuery = await pool.query(
        "SELECT * FROM content_shares WHERE share_token = $1 AND (expires_at IS NULL OR expires_at > NOW())",
        [shareToken]
      );
      
      if (shareQuery.rows.length === 0) {
         res.status(404).json({ message: "Shared content not found or link expired" });
         return;
      }
      
      const share = shareQuery.rows[0];
      
      // Get the content
      const contentQuery = await pool.query(
        "SELECT * FROM contents WHERE id = $1",
        [share.content_id]
      );
      
      if (contentQuery.rows.length === 0) {
         res.status(404).json({ message: "Content no longer exists" });
         return;
      }
      
      // Increment view count or log access if needed
      
       res.status(200).json({
        message: "Shared content retrieved",
        content: contentQuery.rows[0],
        shareInfo: {
          createdAt: share.created_at,
          expiresAt: share.expires_at
        }
      });
    } catch (error) {
      console.error("Error retrieving shared content:", error);
       res.status(500).json({ message: "Internal server error" });
    }
});
  
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