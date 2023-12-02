const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('./models/User')
const Message = require('./models/Message')
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

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) {
                    console.error(err)
                    res.status(401).json({ error: 'Token verification failed' })
                } else{
                    resolve(userData)
                }
        })
    } else{
        reject('no token')
    }
})
}

app.get('/test', (req, res) => {
    res.json('test ok')
})

app.get('/messages/:userId', async (req, res) => {
    const {userId} = req.params
    const userData = await getUserDataFromRequest(req)
    const ourUserId = userData.userId
    const messages = await Message.find({
            sender: {$in:[userId,ourUserId]},
            recipient: {$in:[userId, ourUserId]}
        }).sort({createdAt:1})
    res.json(messages)

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

app.get('/people', async (req, res) => {
    const users = await User.find({}, {'_id':1, username:1})
    res.json(users)
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

app.post('/logout', async (req,res) => {
    res.cookie('token', '', {sameSite:'none', secure:true}).json('ok')
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

    function NotifyOnlinePeople(){
        // notify everone about online users (when somone connects)
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId:c.userId, username:c.username}))
            }
            ))
        })
    }

    connection.isAlive = true
    connection.timer = setInterval(() => {
        connection.ping()
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false
            clearInterval(connection.timer)
            connection.terminate()
            NotifyOnlinePeople()
        }, 1000)
    }, 5000)

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer)
    })
    //console.log(req.headers)
    // read username and id from the cookie for this connection
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
                });
            }
        }
    }
    
    NotifyOnlinePeople()

    connection.on('message', async (receivedMessage) => {
        const message = JSON.parse(receivedMessage.toString())
        console.log(message)
        const {recipient, text} = message
        if (recipient && text ){
            msgDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text
            });

            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach( c => c.send(JSON.stringify({
                        text, 
                        sender: connection.userId,
                        recipient,
                        _id: msgDoc._id})))
        }
    })
})
