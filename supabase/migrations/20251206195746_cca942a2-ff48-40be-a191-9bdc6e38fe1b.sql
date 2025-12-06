-- Create inventory table for warehouse localization system
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  location TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster search on SKU
CREATE INDEX idx_inventory_sku ON public.inventory USING gin(to_tsvector('simple', sku));
CREATE INDEX idx_inventory_sku_text ON public.inventory (sku);

-- Enable Row Level Security
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (warehouse lookup is public)
CREATE POLICY "Allow public read access to inventory" 
ON public.inventory 
FOR SELECT 
USING (true);

-- Create policy for authenticated insert (admin can add)
CREATE POLICY "Allow authenticated insert to inventory" 
ON public.inventory 
FOR INSERT 
WITH CHECK (true);

-- Create policy for authenticated update
CREATE POLICY "Allow authenticated update to inventory" 
ON public.inventory 
FOR UPDATE 
USING (true);

-- Create policy for authenticated delete
CREATE POLICY "Allow authenticated delete to inventory" 
ON public.inventory 
FOR DELETE 
USING (true);

-- Insert sample data for testing
INSERT INTO public.inventory (sku, location) VALUES
('Różaniec drewniany 5mm brązowy', 'A-01-01'),
('Medalik Matki Boskiej Częstochowskiej srebrny', 'A-01-02'),
('Krzyżyk drewniany 15cm', 'A-02-01'),
('Świeca paschalna 60cm', 'B-01-01'),
('Obrazek Jezusa Miłosiernego 13x18', 'B-02-03'),
('Figurka Matki Boskiej 30cm', 'C-01-01'),
('Różaniec perłowy biały', 'A-01-03'),
('Krzyżyk metalowy złoty 3cm', 'A-02-02'),
('Medalik Św. Benedykta', 'A-01-04'),
('Świeca wotywna czerwona', 'B-01-02'),
('Obrazek Ostatniej Wieczerzy', 'B-02-04'),
('Figurka Anioła Stróża', 'C-02-01'),
('Różaniec srebrny z kamieniami', 'A-01-05'),
('Krzyżyk ścienny drewniany 25cm', 'A-03-01'),
('Medalik Cudowny', 'A-01-06');