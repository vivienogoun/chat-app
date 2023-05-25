const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()

const port = 3000

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

const uri = process.env.uri

const Message = mongoose.model('Message', {
  name: String,
  message: String
})

app.get('/messages', async (req, res) => {
  await Message.find({}).then((messages) => {
    res.send(messages)
  }).catch((err) => {
    console.error(err)
  })
})

app.post('/messages', async (req, res) => {
  try {
    const message = new Message(req.body)
    await message.save()
    const censored = await Message.findOne({message: 'bad'})
    if (censored) {
      await Message.findByIdAndRemove({_id: censored.id})
    } else {
      io.emit('message', req.body)
    }
    res.sendStatus(200)
  } catch (err) {
    res.sendStatus(500)
    return console.error(err)
  }
})

io.on('connection', (socket) => {
  console.log('a user connected')
})

mongoose.connect(uri).then(() => {
  console.log('connected to db')
}).catch((err) => {
  console.error(err)
})

http.listen(port, () => {
  console.log(`server is listening on localhost:${port}`)
})