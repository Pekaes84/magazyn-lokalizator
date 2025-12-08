-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create Lokalizacje table for inventory data
CREATE TABLE public."Lokalizacje" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "Symbol" TEXT NOT NULL UNIQUE,
  "Kod kreskowy" TEXT,
  "Nazwa" TEXT,
  "Kontener" TEXT,
  "Regał" TEXT,
  "Półka" TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public."Lokalizacje" ENABLE ROW LEVEL SECURITY;

-- Public read access (all users can search inventory)
CREATE POLICY "Anyone can view inventory" 
ON public."Lokalizacje" 
FOR SELECT 
USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert inventory" 
ON public."Lokalizacje" 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update inventory" 
ON public."Lokalizacje" 
FOR UPDATE 
TO authenticated
USING (true);

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete inventory" 
ON public."Lokalizacje" 
FOR DELETE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lokalizacje_updated_at
BEFORE UPDATE ON public."Lokalizacje"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();