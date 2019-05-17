var express = require("express");
var router = express.Router({mergeParams:true});
var Campground = require("../models/campgrounds");
var Comment = require("../models/comment");
var User = require("../models/user");
var middlewareObj = require("../middleware");

router.get("/new", middlewareObj.isLoggedIn ,(req, res)=>{
    Campground.findById(req.params.id, (err,campground)=>{
        if(err){console.log(err)}
        else{
            res.render("comments/new", {campground : campground});
        }
    });
});

router.post("/", middlewareObj.isLoggedIn ,(req,res)=>{
    Campground.findById(req.params.id, (err,campground)=>{
        if(err){console.log(err)}
        else{
            Comment.create(req.body.comment, (err, comment)=>{
                if(err){console.log(err)}
                else
                {
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    
                    comment.save();
                    campground.comment.push(comment);
                    campground.save();
                    res.redirect("/campgrounds/"+campground._id); 
                }
            });
        }
    });
});

router.get("/:comment_id/edit", middlewareObj.checkCommentOwnership ,(req,res)=>{
        
        Comment.findById(req.params.comment_id , (err, foundComment)=>{
            if(err){res.redirect("back")}
            else{
                    res.render("comments/edit", {campground_id : req.params.id, comment: foundComment});
            }
        }) 
})

router.put("/:comment_id/", middlewareObj.checkCommentOwnership ,(req, res)=>{
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment)=>{
        if(err){res.redirect("back");}
        else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
})

router.delete("/:comment_id", middlewareObj.checkCommentOwnership ,(req, res)=>{
    Comment.findByIdAndRemove(req.params.comment_id, (err)=>{
        if(err){res.redirect("back");}
        req.flash("success", "Comment deleted");
        res.redirect("back");
    })
})


module.exports = router;