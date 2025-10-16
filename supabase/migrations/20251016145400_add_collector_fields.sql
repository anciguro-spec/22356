/*
  # Add Collector-Specific Fields to Phase Records

  1. Overview
    Adds detailed collection fields required by collectors including GPS coordinates,
    weather data, harvest information, pricing, and weight details.

  2. New Columns Added to phase_records table
    - gps_latitude: Latitude coordinate (auto-captured)
    - gps_longitude: Longitude coordinate (auto-captured)
    - weather_data: Weather information at time of collection (auto-captured)
    - harvest_date: Date when the product was harvested
    - seed_crop_name: Name of the seed/crop/raw material
    - pesticide_used: Boolean indicating if pesticides were used
    - pesticide_name: Name of pesticide if used
    - pesticide_quantity: Quantity of pesticide used
    - price_per_unit: Price per unit of the product
    - weight_total: Total weight of the batch
    - total_price: Calculated total price (price_per_unit * weight_total)
    - qr_code_url: URL/data for the generated QR code

  3. Notes
    - All collector-specific fields are optional to maintain backward compatibility
    - Weather data stored as JSONB to accommodate various weather API responses
    - Total price can be calculated automatically on the frontend
*/

-- Add collector-specific fields to phase_records
DO $$
BEGIN
  -- GPS coordinates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'gps_latitude'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN gps_latitude numeric(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'gps_longitude'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN gps_longitude numeric(11, 8);
  END IF;

  -- Weather data
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'weather_data'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN weather_data jsonb;
  END IF;

  -- Harvest information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'harvest_date'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN harvest_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'seed_crop_name'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN seed_crop_name text;
  END IF;

  -- Pesticide information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'pesticide_used'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN pesticide_used boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'pesticide_name'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN pesticide_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'pesticide_quantity'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN pesticide_quantity text;
  END IF;

  -- Pricing and weight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'price_per_unit'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN price_per_unit numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'weight_total'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN weight_total numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'total_price'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN total_price numeric(12, 2);
  END IF;

  -- QR code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phase_records' AND column_name = 'qr_code_url'
  ) THEN
    ALTER TABLE phase_records ADD COLUMN qr_code_url text;
  END IF;
END $$;
