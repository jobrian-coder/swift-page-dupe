
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  earned NUMERIC(10,2) NOT NULL DEFAULT 0,
  reviews_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  location TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏢',
  color TEXT NOT NULL DEFAULT '#0f766e',
  payout NUMERIC(6,2) NOT NULL,
  total_spots INT NOT NULL DEFAULT 200,
  taken_spots INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read companies" ON public.companies FOR SELECT USING (true);

-- reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  reward NUMERIC(6,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reviews select" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own reviews insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- withdrawals
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own withdrawals select" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own withdrawals insert" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed companies
INSERT INTO public.companies (name, industry, location, emoji, color, payout, total_spots, taken_spots) VALUES
('American Express','Financial Services','New York, New York','💳','#2563eb',4.90,200,53),
('Apple Inc.','Consumer Electronics','Cupertino, California','🍎','#111827',4.20,200,162),
('Best Buy','Consumer Electronics Retail','Richfield, Minnesota','🛒','#eab308',5.15,200,101),
('Boeing','Aerospace & Defense','Arlington, Virginia','✈️','#1e40af',3.57,200,190),
('CVS Health','Healthcare & Retail','Woonsocket, Rhode Island','❤️','#dc2626',3.10,200,193),
('Chevron','Energy & Oil','San Ramon, California','⛽','#1d4ed8',3.29,200,199),
('Coca-Cola','Beverages','Atlanta, Georgia','🥤','#dc2626',4.10,200,88),
('Costco','Retail','Issaquah, Washington','🛍️','#1e3a8a',3.85,200,145),
('Delta Air Lines','Airlines','Atlanta, Georgia','🛫','#991b1b',4.42,200,120),
('Disney','Entertainment','Burbank, California','🏰','#0ea5e9',5.00,200,60),
('Ford','Automotive','Dearborn, Michigan','🚗','#1e40af',3.90,200,150),
('General Electric','Industrial','Boston, Massachusetts','⚡','#0891b2',3.75,200,175),
('Google','Technology','Mountain View, California','🔎','#0f766e',5.20,200,40),
('Home Depot','Home Improvement','Atlanta, Georgia','🔨','#ea580c',3.60,200,155),
('IBM','Technology','Armonk, New York','💻','#1e3a8a',4.30,200,110),
('Intel','Semiconductors','Santa Clara, California','🔬','#2563eb',4.05,200,130),
('JP Morgan','Banking','New York, New York','🏦','#0f172a',5.10,200,70),
('Johnson & Johnson','Healthcare','New Brunswick, New Jersey','💊','#b91c1c',3.95,200,168),
('Kroger','Grocery','Cincinnati, Ohio','🥬','#1e40af',3.20,200,180),
('Lockheed Martin','Aerospace','Bethesda, Maryland','🚀','#0f172a',4.55,200,95),
('Lowe''s','Home Improvement','Mooresville, North Carolina','🏠','#1e40af',3.50,200,160),
('McDonald''s','Restaurants','Chicago, Illinois','🍔','#dc2626',3.05,200,197),
('Meta','Technology','Menlo Park, California','📘','#2563eb',5.05,200,55),
('Microsoft','Technology','Redmond, Washington','🪟','#0ea5e9',4.85,200,45),
('Netflix','Entertainment','Los Gatos, California','🎬','#dc2626',4.60,200,78),
('Nike','Apparel','Beaverton, Oregon','👟','#111827',4.15,200,133),
('Nvidia','Semiconductors','Santa Clara, California','🎮','#16a34a',5.30,200,32),
('Oracle','Technology','Austin, Texas','🗄️','#dc2626',4.25,200,115),
('PepsiCo','Beverages','Purchase, New York','🥤','#1e40af',3.80,200,148),
('Pfizer','Pharmaceuticals','New York, New York','💉','#2563eb',4.00,200,140),
('Procter & Gamble','Consumer Goods','Cincinnati, Ohio','🧴','#0ea5e9',3.65,200,158),
('Salesforce','Technology','San Francisco, California','☁️','#0284c7',4.75,200,85),
('Samsung','Electronics','Seoul, South Korea','📱','#1e40af',4.35,200,105),
('Shell','Energy','London, UK','⛽','#eab308',3.45,200,182),
('Sony','Electronics','Tokyo, Japan','🎧','#111827',4.20,200,125),
('Starbucks','Restaurants','Seattle, Washington','☕','#16a34a',3.15,200,192),
('Target','Retail','Minneapolis, Minnesota','🎯','#dc2626',3.40,200,170),
('Tesla','Automotive','Austin, Texas','⚡','#dc2626',5.25,200,48),
('T-Mobile','Telecommunications','Bellevue, Washington','📶','#db2777',3.95,200,142),
('Toyota','Automotive','Toyota City, Japan','🚙','#dc2626',3.70,200,152),
('UPS','Logistics','Atlanta, Georgia','📦','#78350f',3.55,200,165),
('Uber','Transportation','San Francisco, California','🚕','#111827',4.10,200,128),
('Verizon','Telecommunications','New York, New York','📡','#dc2626',3.85,200,146),
('Visa','Financial Services','San Francisco, California','💳','#1e40af',4.65,200,80),
('Walmart','Retail','Bentonville, Arkansas','🛒','#2563eb',3.00,200,199),
('Walt Disney','Media','Burbank, California','🎥','#0ea5e9',4.50,200,90),
('Wells Fargo','Banking','San Francisco, California','🏦','#b91c1c',4.20,200,118),
('Whirlpool','Home Appliances','Benton Harbor, Michigan','🌀','#0891b2',3.60,200,163),
('Xerox','Technology','Norwalk, Connecticut','🖨️','#dc2626',3.35,200,178),
('Adobe','Technology','San Jose, California','🎨','#dc2626',4.70,200,82),
('Airbnb','Travel','San Francisco, California','🏡','#e11d48',4.55,200,88),
('Amazon','E-commerce','Seattle, Washington','📦','#f59e0b',4.90,200,50),
('Spotify','Music','Stockholm, Sweden','🎵','#16a34a',4.40,200,100),
('PayPal','Financial Services','San Jose, California','💰','#1e40af',4.80,200,72),
('Uber Eats','Food Delivery','San Francisco, California','🍕','#16a34a',3.90,200,138),
('DoorDash','Food Delivery','San Francisco, California','🛵','#dc2626',3.80,200,144);
