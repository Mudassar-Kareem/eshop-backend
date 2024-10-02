const catchAsyncErrors = require("../midleware/catchAsyncErrors");
const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const couponModal = require("../modals/couponModal");
const { isSeller } = require("../midleware/auth");

// create coupon
router.post(
  "/create-coupon-code",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const isCoupounCodeExists = await couponModal.find({
        name: req.body.name,
      });
      if (isCoupounCodeExists.length !== 0) {
        return next(new ErrorHandler("Coupon Code already exist", 400));
      }
      const couponCode = await couponModal.create(req.body);
      res.status(201).json({
        success: true,
        couponCode,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all coupon
router.get("/get-coupon/:id",isSeller,catchAsyncErrors(async(req,res,next)=>{
    try {
        const couponCode = await couponModal.find({shopId: req.seller.id});
        res.status(200).json({
            success:true,
            couponCode
        })
    } catch (error) {
        return next(new ErrorHandler(error.message,500))
    }
}))


// delete coupon by id
router.delete("/delete-coupon/:id",catchAsyncErrors(async(req,res,next)=>{
    try {
        const couponCode= await couponModal.findByIdAndDelete(req.params.id);
        if(!couponCode){
            return next(new ErrorHandler("No Copoun code found with this id",404))
        }
        res.status(200).json({
            success:true,
            message: "Coupon code deleted successfully"
        })
    } catch (error) {
        return next(new ErrorHandler(error.message,500))
    }
}))

router.get("/get-coupon/:name",catchAsyncErrors(async(req,res,next)=>{
  try {
    const couponCode = await couponModal.findOne({name: req.params.name});
    res.status(200).json({
      success: true,
      couponCode,
    })
  } catch (error) {
    return next(new ErrorHandler(error.message,500))
  }
}))
module.exports = router;
