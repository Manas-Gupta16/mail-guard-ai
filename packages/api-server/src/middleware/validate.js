/**
 * Input Validation Middleware
 *
 * Uses Zod schemas to validate request bodies. Returns
 * structured 400 errors with field-level detail on failure.
 */

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
          requestId: req.id,
        },
      });
    }

    // Replace body with parsed + sanitized data
    req.body = result.data;
    next();
  };
}

export const validateBody = validate;
