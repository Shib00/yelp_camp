var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema(
    {
            name: String,
            img: String,
            price: String,
            desc: String,
            createdAt: {type: Date, default: Date.now},
            author: 
            {
                id: 
                {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "User"
                },
                username: String
            },
            comment: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }]
    });
    
    module.exports = mongoose.model("Campground", campgroundSchema);