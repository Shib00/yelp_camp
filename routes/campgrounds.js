var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campgrounds");
var User = require("../models/user");
var middlewareObj = require("../middleware");


//INDEX - show all campgrounds
router.get("/", function(req, res){
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({name: regex}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              if(allCampgrounds.length < 1) {
                  noMatch = "No campgrounds match that query, please try again.";
              }
              res.render("campgrounds/index",{campgrounds:allCampgrounds, noMatch: noMatch});
           }
        });
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
           if(err){
               console.log(err);
           } else {
              res.render("campgrounds/index",{campgrounds:allCampgrounds, noMatch: noMatch});
           }
        });
    }
});

router.post("/", middlewareObj.isLoggedIn ,(req, res)=>{
    
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price; 
    var desc = req.body.desc;
    var author = {
        id : req.user._id,
        username: req.user.username 
    }
    var newCampground = {name:name,price: price,img:image,desc:desc,author:author};
    
    Campground.create(newCampground, (err, allcampgrounds)=>{
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.redirect("/campgrounds");
        }
    });
    
});

router.get("/new", middlewareObj.isLoggedIn ,(req, res)=>{
    res.render("campgrounds/new");
});

router.get("/:id" , (req, res)=>{
    
    Campground.findById(req.params.id).populate("comment").exec((err, foundCampground)=>{
        if(err){
            console.log(err);
        }
        else{
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
    
});

router.get("/:id/edit", middlewareObj.checkCampgroundOwnership ,(req, res)=>{
    Campground.findById(req.params.id, (err,foundCampground)=>{
          res.render("campgrounds/edit", {campground: foundCampground});
    })
})

router.put("/:id", middlewareObj.checkCampgroundOwnership ,(req, res)=>{
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampground)=>{
        if(err){res.redirect("/campgrounds")}
        
        res.redirect("/campgrounds/"+ req.params.id);
    })
})

router.delete("/:id", middlewareObj.checkCampgroundOwnership ,(req, res)=>{
    Campground.findByIdAndRemove(req.params.id, (err)=>{
        if(err){res.redirect("/campgrounds")}
        res.redirect("/campgrounds");
    })
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router; 