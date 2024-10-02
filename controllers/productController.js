const catchAsyncErrors = require("../midleware/catchAsyncErrors");
const cloudinary = require("cloudinary").v2;
const ErrorHandler = require("../utils/ErrorHandler");
const express = require("express");
const router = express.Router();
const shopModal = require("../modals/shopModal");
const productModal = require("../modals/productModal");
const orderModal = require("../modals/orderModal");
const { isSeller,isAuthenticated, isAdmin } = require("../midleware/auth");

// create product
router.post(
  "/create-product",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await shopModal.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop id is invalid ", 404));
      } else {
        let images = [];
        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }
        const imagesLinks = [];
        for (let i = 0; i < images.length; i++) {
          const myCloud = await cloudinary.uploader.upload(images[i], {
            folder: "products",
          });
          imagesLinks.push({
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          });
        }

        const productData = req.body;
        productData.images = imagesLinks;
        productData.shop = shop;
        const product = await productModal.create(productData);
        res.status(201).json({
            success: true,
            product
        })
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all product of a shop 
router.get("/get-all-products-shop/:id",catchAsyncErrors(async(req,res,next)=>{
  try {
    const product = await productModal.find({shopId:req.params.id });
    res.status(200).json({
      success:true,
      product
    })
  } catch (error) {
    return next(new ErrorHandler(error.message,500))
  }
}))

// get all product
router.get("/get-all-products",catchAsyncErrors(async(req,res,next)=>{
  try {
    const product= await productModal.find().sort({ createdAt: -1 });
    res.status(200).json({
      success:true,
      product
    })
  } catch (error) {
    return next(new ErrorHandler(error.message,500))
  }
}))


// delete shop products
router.delete("/delete-shop-product/:id",isSeller,catchAsyncErrors(async(req,res,next)=>{
  try {
    const product = await productModal.findById(req.params.id);
    if(!product){
      return next(new ErrorHandler("Product is not with is Id"));
    }
    for(let i=0; i< product.images.length; i++){
      const result = await cloudinary.uploader.destroy(product.images[i].public_id);
    };
    await  product.deleteOne();
    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    return next(new ErrorHandler(error.message,500))
  }
}))

// create new Review
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await productModal.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await orderModal.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all product --- admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await productModal.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router