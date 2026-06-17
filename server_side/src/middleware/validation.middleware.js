const Joi = require('joi');

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req[property] = value;
    next();
  };
}

const schemas = {
  register: Joi.object({
    first_name: Joi.string().min(2).max(100).required(),
    last_name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{6,14}$/).optional(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and number' }),
    role: Joi.string().valid('customer','chef').default('customer'),
    referral_code: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createBooking: Joi.object({
    chef_id: Joi.number().integer().positive().required(),
    address_id: Joi.number().integer().positive().required(),
    booking_date: Joi.date().min('now').required(),
    start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    guests_count: Joi.number().integer().min(1).max(100).default(2),
    booking_type: Joi.string().valid('standard','emergency','event').default('standard'),
    special_instructions: Joi.string().max(500).optional(),
    items: Joi.array().items(Joi.object({
      menu_item_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().min(1).max(50).required()
    })).min(1).required(),
    loyalty_points_to_use: Joi.number().integer().min(0).default(0)
  }),

  createReview: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(1000).optional(),
    food_rating: Joi.number().integer().min(1).max(5).optional(),
    service_rating: Joi.number().integer().min(1).max(5).optional(),
    punctuality_rating: Joi.number().integer().min(1).max(5).optional()
  }),

  updateAddress: Joi.object({
    label: Joi.string().max(50).optional(),
    address_line1: Joi.string().max(255).required(),
    address_line2: Joi.string().max(255).optional(),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
    country: Joi.string().max(100).default('Kenya'),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    is_default: Joi.boolean().default(false)
  })
};

module.exports = { validate, schemas };
