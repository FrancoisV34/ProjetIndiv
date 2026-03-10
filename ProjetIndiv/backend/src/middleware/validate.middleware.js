function validate(validator) {
  return (req, res, next) => {
    const errors = validator(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    next();
  };
}

module.exports = validate;
