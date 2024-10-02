const catchAsyncErrors = require("../midleware/catchAsyncErrors");
const messageModal = require("../modals/messageModal");
const cloudinary = require("cloudinary").v2;
const userModal = require("../modals/userModal");
const ErrorHandler = require("../utils/ErrorHandler");
const sendToken = require("../utils/jwtToken");
const express = require("express");
const router = express.Router();

router.post(
  "/create-new-message",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const messageData = req.body;
      if (req.body.images) {
        const myCloud = await cloudinary.uploader.upload(req.body.images, {
          folder: "messages",
        });
        messageData.images = {
          public_id: myCloud.public_id,
          url: myCloud.url,
        };
      }
      messageData.conversationId = req.body.conversationId;
      messageData.text = req.body.text;
      messageData.sender = req.body.sender;
      const message = new messageModal({
        conversationId: messageData.conversationId,
        text: messageData.text,
        sender: messageData.sender,
        images: messageData.images ? messageData.images : undefined,
      });
      await message.save();
      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all messages with conversation id
router.get(
  "/get-all-messages/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const messages = await messageModal.find({
        conversationId: req.params.id,
      });

      res.status(201).json({
        success: true,
        messages,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message), 500);
    }
  })
);


module.exports= router