const sendToken = (user, statusCode, res,message) => {
  const token = user.getJwtToken();

  // Options for cookie
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  // Setting cookie and sending response
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
    message
  });
};

module.exports = sendToken;
