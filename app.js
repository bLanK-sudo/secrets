require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose')
const app = express();
const encrypt = require('mongoose-encryption')
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology:true})
const {Schema} = mongoose
const userSchema = new Schema({
    email:String,
    password:String
})
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']})
const User = new mongoose.model('user', userSchema)
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.get('/', (req, res) => {
    res.render('home')
})
app.get('/login', (req, res) => {
    res.render('login')
})
app.get('/register', (req, res) => {
    res.render('register')
})
app.post('/register', (req, res) => {
    const user = new User({
        email:req.body.username,
        password:req.body.password
    })
    user.save((err) => {
        if(err){
           console.log(err); 
        }else{
            res.render('secrets')
        }
    })
})
app.post('/login', (req,res) => {
    const user = req.body.username
    const password = req.body.password
    User.findOne({email:user}, (err, results) => {
        if(results){
            if(results.password == password){
                res.render('secrets')
            }
        }
    })
})
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
