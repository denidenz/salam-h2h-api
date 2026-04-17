module.exports = async (req, res) => {
  return res.json({
    responseCode: "2007300",
    responseMessage: "Auth Success",
    accessToken: "TEST_TOKEN",
    tokenType: "BearerToken",
    expiresIn: "900"
  });
};


