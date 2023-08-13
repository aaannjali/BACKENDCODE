const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");

//ccapture the payment and initiate the razorpay order

exports.capturePayment = async(req,res) =>{
        //get courseid and userid
        const {course_id} = req.body;
        const userId = req.body.id;
        //validation
        if(!course_id){
                return res.json({
                        success:false,
                        message:"Please provide valid course id",
                })
        };
        //valid courseid
        let course;
        try {
                course = await Course.findById(course_id);
                if(!course){
                        return res.json({
                                success:false,
                                message:"Could not find the course",
                        })

                }
                //USER ALL PAY FOR THE SAME COURSE
           const uid = new mongoose.Types.ObjectId(userId);
           if(course.studentsEnrolled.includes(uid)){
                return res.status(200).json({
                        success:false,
                        message:'Student is already enrolled',
                });
           }     
                
        } catch (error) {
                console.error(error);
                return res.status(500).json({
                        success:false,
                        message: error.message,

                        });
                
        }
        
        
        //ORDER CREATED
        const amount = course.price;
        const currency = "INR";
        const options ={
                amount: amount * 100,
                currency,
                receipt: Math.random(Date.now()).toString(),
                notes:{
                        courseId: course_id,
                        userId,

                }
        };
        try {
                //INITIATE THE PAYMENT USING RAZORPAY
                const paymentResponse = await instance.orders.create(options);
                console.log(paymentResponse);
                return res.status(200).json({
                        success:true,
                        courseName: course.courseName ,
                        courseDescription:course.courseDescription,
                        thumbnail: course.thumbnail,
                        orderId: paymentResponse.id,
                        currency:paymentResponse.currency,
                        amount:paymentResponse.amount,
                })
                
        } catch (error) {
                console.error(error);
                return res.status(500).json({
                        success:false,
                        message: "Could not initiate order",

                        });
                
        }


};
 //VARIFY SIGNATURE OF RAZORPAY AND SERVER
  exports.verifySignature =  async(req,res) =>{
        const webhookSecret = "12345678";

        const signature = req.headers["x-razorpay-signature"];


        const shasum = crypto.createHmac("sha256", webhookSecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest("hex");

        if(signature == digest){
                console.log("Payment is Authorized");

                const {courseId, userId} = req.body.payload.payment.entity.notes;

                try {
                        //FIND THE COURSE AND ENROLL THE STUDENT IN IT
                        const enrolledCourse = await Course.findOneAndUpdate(
                                {_id: courseId},
                                {$push: {studentsEnrolled: userId}},
                                {new:true},
                        );
                        if(!enrolledCourse){
                                return res.status(500).json({
                                        success:false,
                                        message:"Course not found",
                                });
                        }
                        console.log(enrolledCourse);
                        //FIND THE STUDENT AND ADD THE COURSE TO THEIR LIST ENROLLED COUESES 
                        const enrolledStudent = await User.findOneAndUpdate(
                                {_id: userId},
                                {$push:{courses: courseId}},
                                {new:true},
                        );
                        console.log(enrolledCourse);
                        //MAIL SEND OF CONFORMATION

                        const emailResponse = await mailSender(
                                enrolledStudent.email,
                                "Congratutaion from Us",
                                "You have successfully enrolled in our course",
                        );
                        console.log(emailResponse);
                        return res.status(200).json({
                                success:false,
                                message:"Signature verified and course added",
                        });
                        
                } catch (error) {
                        console.log(error);
                        return res.status(500).json({
                                success:false,
                                message:error.message,
                        });
                        
                }
        }
        else{
                return res.status(400).json({
                        success:false,
                        message:'Invalid Request',
                });
        }
  };