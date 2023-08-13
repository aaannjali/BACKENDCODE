const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({

 courseName:{
    type:String,

 },
 courseDescription:{
    type:String,
 },
 instructor:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,

 },
 whatYouWillLearn:{
    type:String,
 },
 courseContent:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Section",
 }
],
ratingAndReviews:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"ratingAndReview",

}],
price:{
    type:Number,
},
thumbnail:{
    type:String,
},
tag:{
    type: [String],
    require: true,
},
category: {
    type:mongoose.Schema.Types.ObjectId,
    ref: "Category",
},
studentsEnrolled:[{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
    ref:"User",
},],
instructions:{
    type:[String],
},
status:{
    type:String,
    enum:["Draft", "Published"],
},

    
});
//exports the Course model
module.exports = mongoose.model("Course", courseSchema);