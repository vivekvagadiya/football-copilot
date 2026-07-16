class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
  }
}

class ValidationError extends ApiError {
  constructor(message = "Validation Failed", errors = []) {
    super(400, message);

    this.errors = errors;
  }
}

class NotFoundError extends ApiError {
  constructor(message = "Resource Not Found") {
    super(404, message);
  }
}

module.exports = {
  ApiError,
  ValidationError,
  NotFoundError,
};