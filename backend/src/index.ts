import express from 'express'


const app = express();


app.use(express.json())


app.get("/" , (req , res) => {
    res.json({message : "backend up and running"})
})


app.listen(3001 , ()=>{
    console.log("Backend running")
})