// backend/services/rapidFootballApi.service.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const axios = require("axios");

const rapidFootballApi = axios.create({
  baseURL: "https://free-api-live-football-data.p.rapidapi.com",
  headers: {
    "x-rapidapi-host": process.env.RAPID_API_HOST || "free-api-live-football-data.p.rapidapi.com",
    "x-rapidapi-key": process.env.RAPID_API_KEY,
    "Content-Type": "application/json",
  },
});

module.exports = rapidFootballApi;
