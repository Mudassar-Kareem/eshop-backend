

// Function to generate JWT token and set it in the cookie
const ShopeToken = (user, statusCode, res,message) => {
  const token = user.getJwtToken();

  // Options for the cookie
  const options = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 
    ),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  res.status(statusCode).cookie('seller_token', token, options).json({
    success: true,
    token,
    user,  
    message
  });
};

module.exports = ShopeToken;
