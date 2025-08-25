const express = require('express')
const app = express()
const dbConfig = require('./config/dbConfig')
const userRoutes = require('./routes/userRoutes')

app.use(express.json())
app.use('/api/users', userRoutes)


app.listen(8082, ()=>{
    console.log("server running on port 8082")
})