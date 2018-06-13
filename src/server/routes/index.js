let cardController = require('../controllers/card');
let checkoutController = require('../controllers/checkout');
let searchController = require('../controllers/search');
let userController = require('../controllers/user');
let upload = require('multer')();

// check token
const verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];
  if (!token)
    return res.status(401).send({
      message: "Token is not provided"
    });
  else
    next();
};

module.exports = (app) => {
  app.get("/api", (req, res) => res.status(200).send({
    message: "Welcome to the API!",
  }));

  // get template elements
  app.post("/api/card/get-template-elements", verifyToken, cardController.getTemplateElements);

  // get card product
  app.post("/api/checkout/get-4over-product-info", verifyToken, checkoutController.get4OverProductInfo);

  // get post base prices
  app.post("/api/checkout/get-pc-base-prices", verifyToken, checkoutController.getPCBasePrices);

  // get shipping quote
  app.post("/api/checkout/get-shipping-quote", verifyToken, checkoutController.getShippingQuote);

  // upload post card info to aws s3
  app.post("/api/checkout/upload-to-aws-s3", upload.array("files"), checkoutController.uploadToAWSS3);

  // search templates
  app.post("/api/search/templates", verifyToken, searchController.searchTemplates);

  // checkout
  app.post("/api/checkout/create-4over-order", verifyToken, checkoutController.createOrder);

  // verify billing info
  app.post("/api/user/verify-billinginfo", verifyToken, userController.verifyBillingInfo);

  // verify shipping info
  app.post("/api/user/verify-shippinginfo", verifyToken, userController.verifyShippingInfo);
}
