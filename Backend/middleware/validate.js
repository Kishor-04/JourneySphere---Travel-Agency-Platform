function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ errors });
    }
    req.validated = result.data;
    next();
  };
}

module.exports = validate;
