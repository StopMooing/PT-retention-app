-- Where a food's numbers came from. Government databases are identified by `source`;
-- branded products (source 'BRAND') also record the brand's own product page here.
alter table public.foods add column source_url text;
