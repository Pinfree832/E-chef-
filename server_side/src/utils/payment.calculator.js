function calculateBookingCost({ items, chef, distance = 0, booking_type = 'standard', loyalty_points_used = 0 }) {
  const food_cost = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const estimated_hours = Math.max(...items.map(i => i.menu_item?.prep_time_mins || 60)) / 60;
  const chef_fee = chef.base_hourly_rate * Math.max(estimated_hours, 1);

  const transport_fee = distance * (chef.travel_rate_per_km || 50);

  const equipment_fee = booking_type === 'event'
    ? (chef.equipment_fee || 0) * 1.5
    : (chef.equipment_fee || 0);

  const extra_service_fee = booking_type === 'emergency' ? chef_fee * 0.5 : 0;

  const subtotal = food_cost + chef_fee + transport_fee + equipment_fee + extra_service_fee;

  const commission_rate = parseFloat(process.env.PLATFORM_COMMISSION_RATE || 15) / 100;
  const platform_commission = subtotal * commission_rate;

  const loyalty_discount = loyalty_points_used > 0 ? Math.min(loyalty_points_used / 10, subtotal * 0.2) : 0;

  const taxable = subtotal + platform_commission - loyalty_discount;
  const tax_rate = parseFloat(process.env.TAX_RATE || 16) / 100;
  const tax = taxable * tax_rate;

  const total = Math.max(0, taxable + tax);

  return {
    food_cost: round(food_cost),
    chef_fee: round(chef_fee),
    transport_fee: round(transport_fee),
    equipment_fee: round(equipment_fee),
    extra_service_fee: round(extra_service_fee),
    platform_commission: round(platform_commission),
    loyalty_discount: round(loyalty_discount),
    tax: round(tax),
    total: round(total)
  };
}

function round(val) {
  return Math.round(val * 100) / 100;
}

module.exports = { calculateBookingCost };
