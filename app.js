const express=require("express")
const config=require("config")
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const cors=require("cors")
const path=require('path')
const cups = require("node-cups");
const PORT=config.get("port")||5000

const app=express()


app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({extended:true}))
app.use('/api/print',require('./routes/print.routes.js'))

async function start(){
  try {
    const printerNames = await cups.getPrinterNames();
    console.log(printerNames);
    await mongoose.connect(config.get('mongodbUri'),{
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    app.listen(PORT,()=>console.log(`Server has been started at ${PORT}`)
    )
  } catch (error) {
    console.log('SErver error',error.message)
    process.exit(1)
  }
}

start()




