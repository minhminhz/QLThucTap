const AppError = require('./appError');

/**
 * Reusable validation functions and middleware helpers
 */

// Basic email regex conforming to standard email format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Vietnam phone number format (03x, 05x, 07x, 08x, 09x or +84)
const VIETNAM_PHONE_REGEX = /^(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;

/**
 * Checks if a string is a valid email
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim().toLowerCase());
}

/**
 * Checks if a string is a valid Vietnamese phone number
 */
function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
    return VIETNAM_PHONE_REGEX.test(cleanPhone);
}

/**
 * Checks if a value is a valid positive integer (e.g. ID > 0)
 */
function isValidId(val) {
    if (val === undefined || val === null || val === '') return false;
    const num = Number(val);
    return Number.isInteger(num) && num > 0;
}

/**
 * Checks if a value is a valid score within [min, max] (default 0 to 10)
 */
function isValidScore(val, min = 0, max = 10) {
    if (val === undefined || val === null || val === '') return false;
    const num = Number(val);
    return !isNaN(num) && num >= min && num <= max;
}

/**
 * Checks if a string is a valid date (YYYY-MM-DD or standard parseable ISO)
 */
function isValidDate(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
}

/**
 * Checks if date is today or in the future
 */
function isFutureOrToday(dateStr) {
    if (!isValidDate(dateStr)) return false;
    const target = new Date(dateStr);
    target.setHours(23, 59, 59, 999);
    return target.getTime() >= Date.now();
}

/**
 * Express middleware to validate :id parameter in URL routes
 */
function validateIdParam(paramName = 'id') {
    return (req, res, next) => {
        const idValue = req.params[paramName];
        if (!isValidId(idValue)) {
            return next(new AppError(`Mã định danh (${paramName}="${idValue}") không hợp lệ. Phải là số nguyên dương.`, 400));
        }
        next();
    };
}

module.exports = {
    EMAIL_REGEX,
    VIETNAM_PHONE_REGEX,
    isValidEmail,
    isValidPhone,
    isValidId,
    isValidScore,
    isValidDate,
    isFutureOrToday,
    validateIdParam
};
