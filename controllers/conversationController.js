const { isSeller, isAuthenticated } = require("../midleware/auth");
const catchAsyncErrors = require("../midleware/catchAsyncErrors");
const conversationModal  = require("../modals/conversationModal");
const ErrorHandler = require("../utils/ErrorHandler");
const express = require("express");
const router = express.Router();

// create new conversation
router.post("/create-new-conversation",catchAsyncErrors(async(req,res,next)=>{
    try {
        const { groupTitle, userId, sellerId } = req.body;

      const isConversationExist = await conversationModal.findOne({ groupTitle });
      if(isConversationExist){
        const conversation= isConversationExist;
        res.status(200).json({
            success:true,
            conversation
        })
      }else{
        const conversation= await conversationModal.create({
            members:[userId,sellerId],
            groupTitle:groupTitle
        })
        res.status(201).json({
            success:true,
            conversation
          })
      }
     
    } catch (error) {
        return next(new ErrorHandler(error.message,500))
    }
}))

// get seller all mesage
router.get("/get-all-seller-conversation/:id",isSeller,catchAsyncErrors(async(req,res,next)=>{
  try {
    const conversation =  await conversationModal.find({
      members:{
        $in : [req.params.id]
      }
    }).sort({updatedAt: -1, createdAt: -1})
    res.status(200).json({
      success:true,
      conversation
    })
  } catch (error) {
    return next(new ErrorHandler(error.message,500))
  }
}))

// get user all conversation
router.get("/get-all-user-conversation/:id",isAuthenticated,catchAsyncErrors(async(req,res,next)=>{
  try {
    const conversation =  await conversationModal.find({
      members:{
        $in : [req.params.id]
      }
    }).sort({updatedAt: -1, createdAt: -1})
    res.status(200).json({
      success:true,
      conversation
    })
  } catch (error) {
    return next(new ErrorHandler(error.message,500))
  }
}))

// update the last message
router.put(
  "/update-last-message/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { lastMessage, lastMessageId } = req.body;

      const conversation = await conversationModal.findByIdAndUpdate(req.params.id, {
        lastMessage,
        lastMessageId,
      });

      res.status(201).json({
        success: true,
        conversation,
      });
    } catch (error) {
      return next(new ErrorHandler(error), 500);
    }
  })
);

module.exports=router
