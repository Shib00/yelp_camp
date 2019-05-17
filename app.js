var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    Campground  = require("./models/campgrounds"),
    Comment     = require("./models/comment"),
    seedDB      = require("./seed"),
    User        = require("./models/user"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    methodOverride = require("method-override"),
    localStrategy = require("passport-local");
    
var commentRoute = require("./routes/comments"),
    campgroundRoute = require("./routes/campgrounds"),
    indexRoute = require("./routes/index");
    
var url = process.env.DATABASEURL || 'mongodb://localhost:27017/yelp_camp';

mongoose.connect(url, {useNewUrlParser : true});

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(flash());

app.use(require("express-session")({
    secret: "well holy moly",
    resave: false,
    saveUninitialized: false
}));


app.locals.moment = require('moment');
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next)=>{
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/campgrounds/:id/comment",commentRoute);
app.use("/campgrounds",campgroundRoute);
app.use(indexRoute);

//seedDB();

app.listen(process.env.PORT, process.env.IP, ()=>{
    console.log("Yelp camp server started");
});