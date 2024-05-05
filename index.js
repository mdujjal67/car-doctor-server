const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())


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

async function run() {
  try {

    const servicesCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('booking');


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
      app.get('/booking', async(req, res) => {
        console.log(req.query.email)
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