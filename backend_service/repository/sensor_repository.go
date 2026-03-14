package repository

import (
	"database/sql"
	"fmt"
	"time"
)

// SensorRepository defines the interface for sensor data operations
type SensorRepository interface {
	GetLatestReadings() ([]SensorReading, error)
}

// SensorReading represents a sensor with its latest reading
type SensorReading struct {
	SensorID        string
	LocationName    string
	LocationAddress string
	Latitude        float64
	Longitude       float64
	Temperature     float64
	Humidity        float64
	VOCLevel        int
	AirQualityIndex int
	RiskLevel       string
	Timestamp       time.Time
}

type sensorRepository struct {
	db *sql.DB
}

// NewSensorRepository creates a new sensor repository
func NewSensorRepository(db *sql.DB) SensorRepository {
	return &sensorRepository{db: db}
}

// GetLatestReadings retrieves the most recent reading from every active sensor
// Uses TimescaleDB hypertable with DISTINCT ON for efficient querying
func (r *sensorRepository) GetLatestReadings() ([]SensorReading, error) {
	// Use DISTINCT ON with ORDER BY to efficiently get latest reading per sensor
	// This leverages the idx_sensor_readings_sensor_time index (sensor_id, time DESC)
	query := `
		SELECT DISTINCT ON (sr.sensor_id)
			s.sensor_id,
			s.location_name,
			s.location_address,
			ST_Y(s.location::geometry) AS lat,
			ST_X(s.location::geometry) AS lng,
			sr.temperature,
			sr.humidity,
			sr.voc_level,
			sr.air_quality_index,
			sr.risk_level,
			sr.time
		FROM sensors s
		INNER JOIN sensor_readings sr ON s.sensor_id = sr.sensor_id
		WHERE s.is_active = true
		ORDER BY sr.sensor_id, sr.time DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query latest readings: %w", err)
	}
	defer rows.Close()

	var readings []SensorReading

	for rows.Next() {
		var reading SensorReading
		err := rows.Scan(
			&reading.SensorID,
			&reading.LocationName,
			&reading.LocationAddress,
			&reading.Latitude,
			&reading.Longitude,
			&reading.Temperature,
			&reading.Humidity,
			&reading.VOCLevel,
			&reading.AirQualityIndex,
			&reading.RiskLevel,
			&reading.Timestamp,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		readings = append(readings, reading)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return readings, nil
}
