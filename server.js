'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
var lookup = require('dns-lookup');
const extractDomain = require('extract-domain');
var autoIncrement = require('mongoose-auto-increment');

  
var bodyParser = require('body-parser');
mongoose.Promise = global.Promise; 
      
var cors = require('cors');
      
var app = express();
          
// Basic Configuration      
var port = process.env.PORT || 3000;      
  
/** this project needs a db !! **/ 
  mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});
         
app.use(cors());  
 
/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(process.cwd() + '/public')); 
 
app.get('/', function(req, res){ 
  res.sendFile(process.cwd() + '/views/index.html');
});   
  
    
// your first API endpoint...   
var urlShortnerSchema = mongoose.Schema({ 
  "original_url": {type:String, required:true, unique:true},
  "short_url": Number
})  
    
var Urlcollection = mongoose.model("Url", urlShortnerSchema);   
 
function UrlValidation(req, res, next){     
       
  
  let myregex= /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm
  var str = req.body.url 
     
   var domain = extractDomain(str)  
      
  var validStructure = myregex.test(str)   
  
  var w3 = lookup(domain, function (err,  address, family) {
       
    if(address && validStructure && family){       
      console.log(address,family)  
    next()       
  }
  else{   
    res.json({"error":"invalid URL"})
    }
  });  
     
}


app.post("/api/shorturl/new",UrlValidation, function(req,res){     
  var original_url = req.body.url
    
  
  Urlcollection.findOne({"original_url":original_url}, function(err, url){
    if(err){ 
      throw err 
    }       
    if(url){  
      //console.log(url)
      return res.json({"original_url":url.original_url,"short_url":url.short_url})
    }
  })
  
  var encoder = Urlcollection.find().sort( { short_url: -1 } ).limit(1)
  .exec((err, urls)=> { 
    if(err){ 
      throw err   
    }    
    //console.log(urls)  
    return  urls    
  })           
  console.log(encoder)         
                      
  var url = new Urlcollection({   
    "original_url": original_url,    
    "short_url": Math.floor(Math.random() * 1000000)   
  })      
      
         
  url.save()      
  .then(item => {  
        //console.log(item)    
        res.json({"original_url":item.original_url, "short_url": item.short_url })  
    })   
    .catch(err => {
        res.status(400).send("Unable to send to database")
    })  
})    

 app.get("/api/shorturl/:new", function(req, res){
   var shortUrl = parseInt(req.params.new)
   Urlcollection.findOne({"short_url":shortUrl}, function(err, url){
     if(err){
       throw err
     } 
     else{
       res.status(301).redirect(url.original_url)
     }
   })
   
 })      
    
app.listen(port, function () {
  console.log('Node.js listening ...');  
});    