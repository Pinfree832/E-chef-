-- ============================================================
-- MOBILITY CHEF - Seed Data
-- ============================================================
USE mobility_chef;

-- Commission settings
INSERT INTO commission_settings (name, commission_rate, tax_rate, effective_from, is_active) VALUES
('Standard Rate', 15.00, 16.00, NOW(), TRUE);

-- Subscription plans
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, features, discount_percent, priority_booking, free_deliveries, loyalty_multiplier) VALUES
('Free',    'free',    0.00,  0.00,   '["Basic booking","Standard support"]', 0,  FALSE, 0, 1.0),
('Basic',   'basic',   499.00, 4990.00, '["Priority booking","2 free transport","2x points","SMS alerts"]', 10, TRUE, 2, 2.0),
('Premium', 'premium', 999.00, 9990.00, '["Emergency chef","5 free transport","3x points","24/7 support","AI recommendations"]', 20, TRUE, 5, 3.0);

-- Cuisine categories
INSERT INTO cuisine_categories (name, slug, description, is_active, sort_order) VALUES
('African',      'african',      'Traditional African cuisine',         TRUE, 1),
('Continental',  'continental',  'European continental dishes',         TRUE, 2),
('Asian',        'asian',        'Asian cuisine from across the continent', TRUE, 3),
('BBQ & Grill',  'bbq-grill',    'Barbecue and grilled specialties',    TRUE, 4),
('Seafood',      'seafood',      'Fresh seafood dishes',                TRUE, 5),
('Vegetarian',   'vegetarian',   'Plant-based meals',                   TRUE, 6),
('Pastry & Desserts', 'pastry',  'Sweet treats and baked goods',        TRUE, 7),
('Fusion',       'fusion',       'Creative fusion cuisine',             TRUE, 8);

-- Menu items
INSERT INTO menu_items (category_id, name, slug, description, base_price, prep_time_mins, serves, dietary_tags, calories) VALUES
(1, 'Nyama Choma Platter',   'nyama-choma-platter',   'Slow-roasted goat with kachumbari and ugali', 2500.00, 90, 4, '["halal","gluten-free"]', 850),
(1, 'Ugali & Sukuma Wiki',   'ugali-sukuma-wiki',     'Classic Kenyan staple with collard greens',   800.00,  30, 2, '["vegan","gluten-free"]', 450),
(1, 'Pilau',                 'pilau',                 'Fragrant spiced rice with beef',              1200.00, 60, 3, '["halal"]',               600),
(1, 'Mutura & Chips',        'mutura-chips',          'Traditional sausage with chips',              900.00,  40, 2, '["halal"]',               700),
(2, 'Beef Steak & Veggies',  'beef-steak-veggies',    'Grilled sirloin with seasonal vegetables',   3500.00, 45, 2, '["gluten-free"]',         750),
(2, 'Pasta Carbonara',       'pasta-carbonara',        'Classic Roman pasta',                        1800.00, 30, 2, '[]',                      620),
(2, 'Chicken Cordon Bleu',   'chicken-cordon-bleu',   'Stuffed chicken breast with ham and cheese', 2800.00, 50, 2, '[]',                      680),
(3, 'Chicken Biryani',       'chicken-biryani',        'Aromatic Indian rice dish',                  1500.00, 60, 3, '["halal"]',               580),
(3, 'Sushi Platter',         'sushi-platter',          'Assorted sushi rolls',                       2200.00, 45, 2, '["gluten-free"]',         420),
(4, 'BBQ Ribs Rack',         'bbq-ribs-rack',          'Slow-smoked pork ribs with sauce',           3800.00, 120, 3, '["gluten-free"]',        950),
(5, 'Grilled Tilapia',       'grilled-tilapia',        'Whole tilapia with herbs and lemon',         1800.00, 35, 2, '["gluten-free","halal"]', 380),
(6, 'Vegan Buddha Bowl',     'vegan-buddha-bowl',      'Quinoa bowl with roasted vegetables',        1200.00, 25, 1, '["vegan","gluten-free"]', 420),
(7, 'Chocolate Fondant',     'chocolate-fondant',      'Warm chocolate lava cake',                    650.00, 20, 2, '["vegetarian"]',          380),
(8, 'Swahili-Asian Fusion',  'swahili-asian-fusion',   'Swahili spices meet Asian cooking techniques', 2800.00, 60, 2, '["halal"]',             520);

-- Admin user
INSERT INTO users (role, first_name, last_name, email, phone, password_hash, is_active, is_verified, email_verified_at) VALUES
('admin', 'System', 'Administrator', 'admin@mobilitychef.com', '+254700000001',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUGDOqxjHrLmgn.gEmGxUxPxm', -- hashed: Admin@2024!
 TRUE, TRUE, NOW());

-- Sample chef user
INSERT INTO users (role, first_name, last_name, email, phone, password_hash, is_active, is_verified, email_verified_at) VALUES
('chef', 'James', 'Mwangi', 'chef@mobilitychef.com', '+254712345678',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUGDOqxjHrLmgn.gEmGxUxPxm',
 TRUE, TRUE, NOW());

-- Sample customer user
INSERT INTO users (role, first_name, last_name, email, phone, password_hash, is_active, is_verified, email_verified_at) VALUES
('customer', 'Grace', 'Njoroge', 'customer@mobilitychef.com', '+254798765432',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUGDOqxjHrLmgn.gEmGxUxPxm',
 TRUE, TRUE, NOW());

-- Chef profile for sample chef (user id=2)
INSERT INTO chef_profiles (user_id, bio, specialties, years_of_experience, verification_status, verified_at,
  base_hourly_rate, travel_rate_per_km, equipment_fee, avg_rating, is_available, service_radius_km) VALUES
(2, 'Professional chef with 8 years experience in Kenyan and Continental cuisine',
 '["African","Continental","BBQ"]', 8, 'approved', NOW(),
 2000.00, 50.00, 300.00, 4.80, TRUE, 25);

-- Customer profile for sample customer (user id=3)
INSERT INTO customer_profiles (user_id, dietary_prefs, loyalty_points, referral_code) VALUES
(3, '["halal"]', 250, 'GRACE2024');

-- Sample address for customer
INSERT INTO addresses (user_id, label, address_line1, city, country, latitude, longitude, is_default) VALUES
(3, 'Home', '456 Westlands Avenue', 'Nairobi', 'Kenya', -1.2702, 36.8105, TRUE);
