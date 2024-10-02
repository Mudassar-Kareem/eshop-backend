const catchAsyncErrors = require("../midleware/catchAsyncErrors");
const cloudinary = require("cloudinary").v2;
const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const shopModal = require("../modals/shopModal");
const eventModal = require("../modals/events");
const { isAdmin, isAuthenticated } = require("../midleware/auth");
// create event
router.post(
  "/create-event",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await shopModal.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        let images = [];

        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.uploader.upload(images[i], {
            folder: "events",
          });

          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }

        const eventData = req.body;
        eventData.images = imagesLinks;
        eventData.shop = shop;

        const event = await eventModal.create(eventData);

        res.status(201).json({
          success: true,
          event,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all event by shop id
router.get(
  "/get-shop-event/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const event = await eventModal.find({ shopId: req.params.id });
      res.status(200).json({
        success: true,
        event,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get total event
router.get(
  "/get-all-event",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const event = await eventModal.find();
      res.status(200).json({
        success: true,
        event,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// delete event by id
router.delete(
  "/delete-event/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const event = await eventModal.findById(req.params.id);
      if (!event) {
        return next(new ErrorHandler("No event found with this shop Id", 404));
      }
      for (let i = 0; i < event.images.length; i++) {
        const result = await cloudinary.uploader.destroy(
          event.images[i].public_id
        );
      }
      await event.deleteOne();
      res.status(200).json({
        success: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all event --- admin
router.get(
  "/admin-all-events",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const events = await eventModal.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        events,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
