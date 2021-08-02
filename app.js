require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose')
const app = express();
const encrypt = require('mongoose-encryption')
const bcrypt = require('bcrypt');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
const session = require('express-session')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const saltRounds = 10
const findOrCreate = require('mongoose-findorcreate')
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret:'openpantiyadapunda',
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect('mongodb+srv://admin-manish:admin-manish@cluster0.drcsj.mongodb.net/userDB', {useNewUrlParser: true, useUnifiedTopology:true})
mongoose.set('useCreateIndex', true)
const {Schema} = mongoose
const userSchema = new Schema({
    email:String,
    password:String,
    googleId:String,
    username:String,
    secret:String
})
userSchema.plugin(findOrCreate)
userSchema.plugin(passportLocalMongoose)
const User = new mongoose.model('user', userSchema)
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, username: profile.displayName}, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get('/', (req, res) => {
    res.render('home')
})
app.get('/login', (req, res) => {
    res.render('login')
})
app.get('/register', (req, res) => {
    res.render('register')
})
app.get('/secrets', (req, res) => {
        User.find({'secret': {$ne: null}}, (err, user) => {
          if(err){
            console.log(err);
          }else{
            if(user){
              res.render('secrets', {user: user})
            }
          }
        })
})
app.get('/secrets', (req, res) => {
  
})
app.get('/submit', (req, res) => {
  if(req.isAuthenticated()){
      res.render('submit')
  }else{
      res.redirect('/login')
  }
})
app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.post('/register', (req, res) => {
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if(err){
            console.log(err);
            res.redirect('/register')
        }else{
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets')
            })
          }
        })
    
});

app.post('/login', (req,res) => {
    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user, (err) => {
        if(err){
            console.log(err);
        }else{
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets')
            })
        }
    })
})

app.post('/submit', (req, res) => {
  const secret = req.body.secret
  User.findById(req.user._id, (err, results) => {
    if(err){
      console.log(err);
    }else{
      if(results){
        results.secret = secret
        results.save()
        res.redirect('/secrets')
      }
    }
  })
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);
