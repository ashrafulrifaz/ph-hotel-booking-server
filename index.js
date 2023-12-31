const express = require('express')
const cors = require("cors")
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require("dotenv").config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors({
  origin: ['http://localhost:5173', 'https://hotel-booking-5f32b.web.app', 'https://hotel-booking-5f32b.firebaseapp.com'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const logger = async(req, res, next) => {
  console.log(req.method, req.url)
  next()
}

const verifyToken = async(req, res, next) => {
  const token = req?.cookies?.token
  if(!token){
    return res.status(401).send({message: 'unothorized access'})
  } 
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if(err) {
      return res.status(401).send({message: 'unothorized access'})
    } 
    req.user = decoded
    next()
  })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.klq4o7m.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
      // Connect the client to the server	(optional starting in v4.7)
      // await client.connect();   

      const reviewCollection = client.db("hotelDB").collection("review")
      const roomsCollection = client.db("hotelDB").collection("rooms")
      const bookingsCollection = client.db("hotelDB").collection("bookings")

      app.post('/jwt', async(req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.SECRET_KEY, {expiresIn: '24h'})
        res
        .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        })
        .send({result: true})
      })

      app.post('/logout', async(req, res) => {
        const user = req.body;
        res.clearCookie('token', {
          maxAge: 0, 
          sameSite: 'none', 
          secure: true
        }).send({success: true})
      })

      app.get('/review', async(req, res) => {
         const result = await reviewCollection.find().toArray()
         res.send(result)
      })

      app.get('/review/:number', async(req, res) => {
        const number = req.params.number
        const query = {room_number: parseInt(number)}
        const result = await reviewCollection.find(query).toArray()
        res.send(result)
      })

      app.post('/review', async(req, res) => {
        const query = req.body;
        const result = await reviewCollection.insertOne(query)
        res.send(result)
      })

      app.get('/rooms', async(req, res) => {
         const result = await roomsCollection.find().toArray()
         res.send(result)
      })   

      app.get('/rooms/:id', async(req, res) => {
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const result = await roomsCollection.findOne(filter)
        res.send(result)
      })

      app.get('/bookings', logger, verifyToken, async(req, res) => {
      //   console.log(req.query.email, req.user.email);
      //   if(req.query?.email !== req.user?.email) {
      //     return res.status(403).send({message: 'forbidden access'})
      //  }
        let query;
        if(req.query?.email){
          query = {email: req.query.email}
          console.log(req.query.email);
        }
        const result = await bookingsCollection.find(query).toArray()
        res.send(result)
      })

      app.get('/user-bookings/:id', async(req, res) => {
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const result = await bookingsCollection.findOne(filter)
        res.send(result)
      })

      app.get('/bookings/:number', async(req, res) => {
        const number = req.params.number
        const query = {room_number: parseInt(number)}
        const projection = {checkIn: 1, checkOut: 1, image: 0}
        const result = await bookingsCollection.find(query, projection).toArray()
        res.send(result)
      })

      app.post('/bookings', async(req, res) => {
        const query = req.body;
        const result = await bookingsCollection.insertOne(query)
        res.send(result)
      })

      app.put('/user-bookings/:id', async(req, res) => {
        const id = req.params.id
        const updateBooking = req.body;
        const filter = {_id: new ObjectId(id)}
        const booking = {
           $set: {
              checkIn: updateBooking.checkIn,
              checkOut: updateBooking.checkOut
           }
        }
        const result = await bookingsCollection.updateOne(filter, booking)
        res.send(result)
      })

      app.delete('/bookings/:id', async(req, res) => {
        const id = req.params.id
        console.log(req.params);
        const filter = {_id: new ObjectId(id)}
        const result = await bookingsCollection.deleteOne(filter)
        res.send(result)
      })

      // Send a ping to confirm a successful connection
      // await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   //  await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})