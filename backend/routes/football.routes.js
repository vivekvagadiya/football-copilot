const express = require("express");
const router = express.Router();
const footballController = require("../controller/football.controller");

const authenticate = require("../middleware/auth.middleware");
const validateSchema = require("../validators/schema.validator");

router.use(authenticate);

router.get("/dashboard", footballController.getDashboardDataController);

module.exports = router;
