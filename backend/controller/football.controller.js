const footballService = require("../services/football.service");
const apiResponse = require("../utils/apiResponse");

const getDashboardDataController = async (req, res) => {
  try {
    const data = await footballService.getDashboardData(req.query);
    return apiResponse.success(
      res,
      "Dashboard data fetched successfully",
      data,
    );
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

module.exports = { getDashboardDataController };
