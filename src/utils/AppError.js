// Fixes the bug where `new Error(message, statusCode)` silently drops the
// status code.
// the built-in Error constructor doesn't accept one, so every
// thrown error was falling through to the global handler as a 500.
class AppError extends Error {
	constructor(message, statusCode = 500) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = AppError;
