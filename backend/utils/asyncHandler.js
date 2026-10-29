/**
 * Wraps async route handlers to automatically catch rejections
 * and forward them to Express next(err) middleware.
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;
