const { isAuthenticated, isAdmin } = require("../midleware/auth");
const catchAsyncErrors = require("../midleware/catchAsyncErrors");
const cloudinary = require("cloudinary").v2;
const userModal = require("../modals/userModal");
const ErrorHandler = require("../utils/ErrorHandler");
const sendToken = require("../utils/jwtToken");
const express = require("express");
const router = express.Router();

// Create User
router.post(
  "/create-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, email, password, avatar } = req.body;

      // Check if email already exists
      const userEmail = await userModal.findOne({ email });
      if (userEmail) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      // Upload avatar to Cloudinary
      const myCloud = await cloudinary.uploader.upload(avatar, {
        folder: "avatars",
      });

      // Create user object
      const user = await userModal.create({
        name,
        email,
        password,
        avatar: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
      });

      // Send token and save to cookies

      sendToken(user, 201, res, "User created successfully");
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await userModal.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Wrong email or password", 400));
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(new ErrorHandler("Wrong  password", 400));
      }

      sendToken(user, 200, res, "Login Successfully");
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await userModal.findById(req.user.id);
      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, email, password, phoneNumber } = req.body;
      const user = await userModal.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("User not found", 500));
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(new ErrorHandler("Please enter valid information", 500));
      }
      (user.name = name),
        (user.phoneNumber = phoneNumber),
        (user.email = email);
      await user.save();
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// change profile pic
router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await userModal.findById(req.user.id);
      if (!user) {
        return next(new ErrorHandler("User not found", 500));
      }
      if (req.body.avatar !== "") {
        const imageId = user.avatar.public_id;
        await cloudinary.uploader.destroy(imageId);
        const myCloud = await cloudinary.uploader.upload(req.body.avatar, {
          folder: "avatars",
          width: 150,
        });
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      await user.save();
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user password
router.put(
  "/update-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await userModal.findById(req.user.id).select("+password");
      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );
      if (!isPasswordMatched) {
        return next(new ErrorHandler("Please enter correct password", 400));
      }
      if (req.body.newPassword !== req.body.confiemPassword) {
        new ErrorHandler("Password doesn't matched with each other!", 400);
      }
      user.password = req.body.newPassword;
      await user.save();
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user address
router.put(
  "/update-address",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await userModal.findById(req.user.id);
      const isAdressSame = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (isAdressSame) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }
      const isAddressExist = user.addresses.find(
        (address) => address._id === req.body._id
      );
      if (isAddressExist) {
        Object.assign(isAddressExist, req.body);
      } else {
        user.addresses.push(req.body);
      }
      await user.save();
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;
      await userModal.updateOne(
        { _id: userId },
        { $pull: { addresses: { _id: addressId } } }
      );
      const user = await userModal.findById(userId);
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// find user infoormation with the userId
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await userModal.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get All user -- admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await userModal.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user --- admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await userModal.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("Seller is not available with this id", 400)
        );
      }

      await userModal.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// logout user
router.get(
  "/logout",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });
      res.status(200).json({
        success: true,
        message: "Logout Successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

module.exports = router;
