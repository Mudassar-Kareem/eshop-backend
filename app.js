require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorMiddleware = require("./midleware/error");
const{ rateLimit } = require('express-rate-limit');
const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// CORS
const corsOptions = {
    origin: 'http://localhost:3000', // Allow only this origin
    optionsSuccessStatus: 200, // For legacy browser support
    credentials: true, // Enable to allow cookies
  };
  
  app.use(cors(corsOptions));

  const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})

// Routes
const user = require("./controllers/userController");
const shop = require("./controllers/shopController")
const product = require("./controllers/productController")
const event = require("./controllers/event");
const couponCode = require("./controllers/couponController")
const payment = require("./controllers/Payments")
const order = require("./controllers/orderController")
const conversation = require("./controllers/conversationController")
const message = require("./controllers/messageController")
app.use("/api/v1/user",user);
app.use("/api/v1/shop",shop)
app.use("/api/v1/product",product)
app.use("/api/v1/event",event);
app.use("/api/v1/coupon",couponCode);
app.use("/api/v1/payment",payment);
app.use("/api/v1/order",order)
app.use("/api/v1/conversation",conversation);
app.use("/api/v1/message",message);


// Testing API
app.get('/test', (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'API is working'
    });
});

// Unknown route
app.all('*', (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
app.use(limiter)
app.use(errorMiddleware);

module.exports = { app };
