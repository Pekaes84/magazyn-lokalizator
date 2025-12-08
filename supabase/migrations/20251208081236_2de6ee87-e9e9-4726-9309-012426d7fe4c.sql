-- Drop the insecure public read policy
DROP POLICY IF EXISTS "Allow public read access to inventory" ON public.inventory;

-- Create new policy that only allows authenticated users to read inventory
CREATE POLICY "Allow authenticated read access to inventory" 
ON public.inventory 
FOR SELECT 
TO authenticated
USING (true);