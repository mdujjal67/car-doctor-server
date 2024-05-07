const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); 
const app = express();
const jwt = require('jsonwebtoken'); //for jwt setup
const cookieParser = require('cookie-parser'); //for cookie parser
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


//--------------- mongoDB start--------------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7tyfnet.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// customized middleware
const logger = async(req, res, next) => {
  console.log('called:', req.host, req.originalUrl);
  next()
};

const verifyToken = async(req, res, next) => {    //use this middleware where you want to secure, like booking url
  const token = req?.cookies.token;
  console.log('value of token in middleware:', token)
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
 
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {    // token verify
    // error
    if(err){
      console.log(err);
      return res.status(401).send({message: 'unauthorized'})
    }
    // if token is valid then it would be decoded
    console.log('value in the token:', decoded)
    // req.user = decoded
    next();
  })
  
}




async function run() {
  try {

    const servicesCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('booking');

    // auth related api
    app.post('/jwt', logger, async(req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }); //token generate
      // res
      // .cookie('token', token, { //to read we use cookie but to show on console we have to use as req.cookies.token
      //   httpOnly: true,
      //   secure: false,
      //   sameSite: 'strict'
      // })
      // the commented code would work only localhost but bellow codes would work with production and localhost also.
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

    })
      .send({success:true})
    })



    // services related api 
    app.get('/services', async(req, res) => {
        const cursor = servicesCollection.find(); 
        const result = await cursor.toArray();
        res.send(result);
      });

      // for specific data
      app.get('/booking/:id', async(req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id)}
        const option = {
            projection: {title: 1, price: 1, service_id: 1, img: 1, date: 1}
        }
        const result = await servicesCollection.findOne(query, option);
        res.send(result);
      })

      // for some data
      app.get('/booking',logger, verifyToken, async(req, res) => {
        console.log(req.query.email)
        // console.log('tok tok token:', req.cookies.token);   //for cookie token receive
        let query = {}
        if(req.query?.email){
          query = {email: req.query.email}
        }
        const result = await bookingCollection.find(query).toArray()
        res.send(result)
      })

      // for all data
      app.post('/booking', async(req, res) => {
        const booking = req.body;
        console.log(booking);
        const result = await bookingCollection.insertOne(booking);
        res.send(result)
      })

      // for delete data
      app.delete('/booking/:id', async(req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id)}
        const result = await bookingCollection.deleteOne(query);
        res.send(result);
      })

      // for update data
      app.patch('/booking/:id', async(req, res) => {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const updatedBooking = req.body;
        console.log(updatedBooking);
        const updateDoc = {
          $set: {
            status: updatedBooking.status
          }
        };
        const result = await bookingCollection.updateOne(filter, updateDoc)
        res.send(result)
      })



    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// ---------mongoDB end---------------




app.get('/', (req, res) => {
    res.send('car doctor is running')
})

app.listen(port, () => {
    console.log(`Car doctor is running on port ${port}`)
})