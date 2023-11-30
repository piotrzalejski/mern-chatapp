const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('./models/User')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs')
const ws = require('ws')

dotenv.config()
mongoose.connect(process.env.MONGO_URL)

jwtSecret = process.env.JWT_SECRET
const bcryptSalt = bcrypt.genSaltSync(10)

const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}))
app.get('/test', (req, res) => {
    res.json('test ok')
})

app.get('/profile', (req, res) => {
    const token = req.cookies?.token
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) {
                console.error(err)
                res.status(401).json({ error: 'Token verification failed' })
            } else {
                res.json( userData )
            }
        })
    } else {
        res.status(401).json({ error: 'No token provided' });
    }
})

app.post('/login', async (req,res) => {
    const {username, password} = req.body
    const foundUser = await User.findOne({username})
    if (foundUser) {
        const passOK = bcrypt.compareSync(password,foundUser.password)
        if (passOK) {
            jwt.sign({userId: foundUser._id, username}, jwtSecret, {}, (err,token) => {
                res.cookie('token', token, {sameSite:'none', secure:true}).json({
                    id: foundUser._id,
                })
            })
        }
    }

})

app.post('/register', async (req, res) => {
    const {username, password } = req.body
    try {
        const hashedPass = bcrypt.hashSync(password,bcryptSalt)
        const createdUser = await User.create({
            username,
            password:hashedPass
        })
        jwt.sign({userId: createdUser._id, username}, jwtSecret, {}, (err,token) => {
            if (err) throw err
            res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
                id: createdUser._id,
            })
        })
    } catch (err) {
        if (err) throw err;
        res.status(500).json({error: 'error creating user'})
    }
})

const server = app.listen(4005)

const wss = new ws.WebSocketServer({server})
wss.on('connection', (connection, req) => {
    //console.log(req.headers)
    const cookies = req.headers.cookie
    if (cookies) {
        const tCookieString = cookies.split(';').find(str => str.startsWith('token='))
        // console.log(tCookieString)
        if (tCookieString) {
            const token = tCookieString.split('=')[1]
            //console.log(token)
            if (token) {
                jwt.verify(token, jwtSecret, {}, (err, userData) =>{
                    if (err) throw err
                    //console.log(userData)
                    const {userId, username} = userData;
                    connection.userId = userId
                    connection.username = username
                } )
            }
        }
    }

    //console.log([...wss.clients].map(c => c.username))
    [...wss.clients].forEach(client => {
        client.send(JSON.stringify({
           online: [...wss.clients].map(c => ({userId:c.userId, username:c.username}))
        }
        ))
    })
})