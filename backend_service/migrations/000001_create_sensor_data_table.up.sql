-- enable PostGIS for geospatial
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE sensors (
  sensor_id VARCHAR(50) PRIMARY KEY,
  location_name TEXT NOT NULL,
  location_address TEXT,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- spatial index for efficient location queries
CREATE INDEX idx_sensors_location ON sensors USING GIST (location);

-- sensor readings table (hypertable)
CREATE TABLE sensor_readings (
  time TIMESTAMPTZ NOT NULL,
  sensor_id VARCHAR(50) NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  humidity DOUBLE PRECISION NOT NULL,
  voc_level INTEGER NOT NULL,
  air_quality_index INTEGER NOT NULL,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  CONSTRAINT fk_sensor FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
);

SELECT create_hypertable('sensor_readings', 'time');

-- index for time-series queries
CREATE INDEX idx_sensor_readings_sensor_time ON sensor_readings(sensor_id, time DESC);
CREATE INDEX idx_sensor_readings_risk_time ON sensor_readings (risk_level, time DESC);
