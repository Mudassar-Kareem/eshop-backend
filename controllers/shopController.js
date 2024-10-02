const { isSeller, isAdmin, isAuthenticated } = require("../midleware/auth");
const catchAsyncErrors = require("../midleware/catchAsyncErrors");
const shopModel = require("../modals/shopModal");
const cloudinary = require("cloudinary").v2;
const ErrorHandler = require("../utils/ErrorHandler");
const express = require("express");
const ShopeToken = require("../utils/ShopeToken");
const router = express.Router();

// create shop
router.post(
  "/create-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, email, password, avatar, address, phoneNumber, zipCode } =
        req.body;
      const sellerEmail = await shopModel.findOne({ email });
      if (sellerEmail) {
        return next(new ErrorHandler("Email already Exist", 400));
      }
      const myCloud = await cloudinary.uploader.upload(avatar, {
        folder: "avatars",
      });
      const shop = await shopModel.create({
        name,
        email,
        password,
        avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
        address,
        phoneNumber,
        zipCode,
      });
      ShopeToken(shop, 201, res, "Shop created successfully");
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// shop login
router.post(
  "/shop-login",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const shop = await shopModel.findOne({ email }).select("+password");
      if (!shop) {
        return next(new ErrorHandler("please enter valid information", 400));
      }
      const isPasswordValid = await shop.comparePassword(password);
      if (!isPasswordValid) {
        return next(new ErrorHandler("wrong email or password", 400));
      }
      ShopeToken(shop, 200, res, "Seller Login successfully");
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load seller
router.get(
  "/getseller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await shopModel.findById(req.seller._id);
      if (!seller) {
        return next(new ErrorHandler("Seller doesn't exists", 400));
      }
      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// get shop info by id
router.get(
  "/get-shop-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shop = await shopModel.findById(req.params.id);
      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update shop avatar
router.put(
  "/update-shop-avatar",isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellerExist = await shopModel.findById(req.seller._id);
      if (!sellerExist) {
        return next(new ErrorHandler("No profile found with id", 500));
      }
      const imageId = sellerExist.avatar.public_id;
      await cloudinary.uploader.destroy(imageId);
      const myCloud = await cloudinary.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: "150",
      });
      sellerExist.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
      await sellerExist.save();
      res.status(200).json({
        success: true,
        seller:sellerExist,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//update shop info
router.put("/update-shop-info",isSeller,catchAsyncErrors(async(req,res,next)=>{
  try {
    const { name, description, address, phoneNumber, zipCode } = req.body;
    const shop = await shopModel.findOne(req.seller._id);
    if(!shop){
      return next(new ErrorHandler("Shop not found", 500));
    }
    shop.name = name,
    shop.description=description,
    shop.address=address,
    shop.phoneNumber=phoneNumber,
    shop.zipCode=zipCode,
    await shop.save();
    res.status(200).json({
      success:true,
      shop
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}))
// logout shop
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("seller_token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// get all seller --- for admin
router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await shopModel.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller --- admin
router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await shopModel.findById(req.params.id);

      if (!seller) {
        return next(
          new ErrorHandler("Seller is not available with this id", 400)
        );
      }

      await shopModel.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Seller deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
