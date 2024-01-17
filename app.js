const express=require("express")
const config=require("config")
const https = require('https');
const fs = require('fs');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const cors=require("cors")
const path=require('path')

const PORT=config.get("port")||5000

const app=express()

let options
if(process.env.NODE_ENV==='development'){
options = {

  key: fs.readFileSync(__dirname + '/ssl/homeserver.key', 'utf8'),
 cert: fs.readFileSync(__dirname + '/ssl/homeserver.crt', 'utf8')
};}else{
  options = {

    key: fs.readFileSync(__dirname + '/ssl/hangar2.key', 'utf8'),
   cert: fs.readFileSync(__dirname + '/ssl/hangar2.crt', 'utf8')
}}
const server=https.createServer(options,app)

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({extended:true}))
app.use('/api/print',require('./routes/print.routes.js'))

async function start(){
  try {
    await mongoose.connect(config.get('mongodbUri'),{
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    server.listen(PORT,()=>console.log(`Server has been started at ${PORT}`)
    )
  } catch (error) {
    console.log('SErver error',error.message)
    process.exit(1)
  }
}

start()




