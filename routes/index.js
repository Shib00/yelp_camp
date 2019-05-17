var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campgrounds");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var env = require("dotenv");
env.config();

 

router.get("/", (req, res)=>{
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});


router.post("/register", (req,res)=>{
    var newUser = new User(
                            {
                                username: req.body.username, 
                                firstName: req.body.firstName,
                                lastName: req.body.lastName,
                                email: req.body.email,
                                avatar: req.body.avatar
                            }
                          );
    if(req.body.adminCode === "secretcode123")
    {
        newUser.isAdmin = true;
    }
    
    User.register(newUser, req.body.password, (err,user)=>{
        if(err){
        console.log(err);
        return res.render("register", {error: err.message});
        }
        else
        {
            req.flash("success", "Welcome to YelpCamp "+ user.username);
            passport.authenticate("local")(req, res, ()=>{res.redirect("/campgrounds")});
        }
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});


router.post("/login", passport.authenticate("local",{successRedirect: "/campgrounds", failureRedirect: "/login"}),(req,res)=>{
    
});

router.get("/logout", (req, res)=>{
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
          
        if(err)
        {
            req.flash("Something went wrong");
            res.redirect("back");
        }
          
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: process.env.GMAILID,
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: process.env.GMAILID,
        subject: 'YelpCamp Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions. ' + '\nIf not visible check spam folder');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if(err)
    {
        req.flash("Something went wrong");
        res.redirect("back");
    }
        
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err)
        {
            req.flash("Something went wrong");
            res.redirect("back");
        }
        
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            if(err)
            {
                req.flash("Something went wrong");
                res.redirect("back");
            }
              
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
            if(err)
            {
                req.flash("Something went wrong");
                res.redirect("back");
            }    
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: process.env.GMAILID,
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: process.env.GMAILID,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
      if(err)
        {
            req.flash("Something went wrong");
            res.redirect("back");
        }
    res.redirect('/campgrounds');
  });
});


router.get("/users/:id", (req,res)=>{
    User.findById(req.params.id, (err, foundUser)=>{
        if(err){
            req.flash("error","Something went wrong");
            res.redirect("back");
        }
        Campground.find().where('author.id').equals(foundUser._id).exec((err, campground)=>{
            if(err){
            req.flash("error","Something went wrong");
            res.redirect("back");
            }
            
            res.render("users/show",{user: foundUser, campgrounds: campground});
        })
    })
})

module.exports = router;