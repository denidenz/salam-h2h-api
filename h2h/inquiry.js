module.exports = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    if (!req.body.virtualAccountNo) {
      return res.status(400).json({
        responseCode: "4002400",
        responseMessage: "Invalid request body",
      });
    }

    return res.json({
      message: "SUCCESS",
      data: req.body
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "error",
      error: err.message
    });
  }
};
