-- Function to detect fire start (transition to critical risk level)
-- This function checks if a sensor is transitioning from non-critical to critical
CREATE OR REPLACE FUNCTION notify_fire_start()
RETURNS TRIGGER AS $$
DECLARE
  previous_risk_level VARCHAR(20);
  sensor_location_name TEXT;
  alert_payload JSON;
BEGIN
  -- Only process if new reading is critical
  IF NEW.risk_level = 'critical' THEN
    -- Get the previous risk level for this sensor
    SELECT risk_level INTO previous_risk_level
    FROM sensor_readings
    WHERE sensor_id = NEW.sensor_id
      AND time < NEW.time
    ORDER BY time DESC
    LIMIT 1;

    -- If transitioning to critical from non-critical state, send notification
    IF previous_risk_level IS NULL OR previous_risk_level != 'critical' THEN
      -- Get sensor location name
      SELECT location_name INTO sensor_location_name
      FROM sensors
      WHERE sensor_id = NEW.sensor_id;

      -- Build JSON payload with alert details
      alert_payload := json_build_object(
        'sensor_id', NEW.sensor_id,
        'location_name', sensor_location_name,
        'timestamp', NEW.time,
        'temperature', NEW.temperature,
        'humidity', NEW.humidity,
        'voc_level', NEW.voc_level,
        'air_quality_index', NEW.air_quality_index,
        'previous_risk_level', COALESCE(previous_risk_level, 'unknown'),
        'current_risk_level', NEW.risk_level
      );

      -- Send notification on 'fire_alert' channel
      PERFORM pg_notify('fire_alert', alert_payload::text);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after each insert on sensor_readings
CREATE TRIGGER fire_start_detector
  AFTER INSERT ON sensor_readings
  FOR EACH ROW
  EXECUTE FUNCTION notify_fire_start();
