-- Create trigger function to automatically record price history
-- This fires AFTER every UPDATE on issuer_trading table

-- First, create the INSERT function (must exist before trigger references it)
CREATE OR REPLACE FUNCTION record_price_history_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.price_history (ticker, price, supply, timestamp)
    VALUES (NEW.ticker, NEW.current_price, NEW.current_supply, NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the UPDATE function
CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only record if price or supply actually changed
    IF OLD.current_price IS DISTINCT FROM NEW.current_price 
       OR OLD.current_supply IS DISTINCT FROM NEW.current_supply THEN
        INSERT INTO public.price_history (ticker, price, supply, timestamp)
        VALUES (NEW.ticker, NEW.current_price, NEW.current_supply, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on issuer_trading for UPDATES
CREATE TRIGGER trigger_record_price_history
    AFTER UPDATE ON public.issuer_trading
    FOR EACH ROW
    EXECUTE FUNCTION record_price_history();

-- Also record when a new issuer_trading row is inserted (initial state)
CREATE TRIGGER trigger_record_price_history_insert
    AFTER INSERT ON public.issuer_trading
    FOR EACH ROW
    EXECUTE FUNCTION record_price_history_on_insert();

-- Add comment explaining the trigger
COMMENT ON FUNCTION record_price_history() IS 'Automatically records price/supply snapshots when issuer_trading is updated';
COMMENT ON FUNCTION record_price_history_on_insert() IS 'Records initial price/supply snapshot when new issuer_trading row is created';
