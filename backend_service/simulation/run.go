// Package simulation is solely for simulating sensor data readings
// coming from MQTT
package simulation

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math"
	"math/rand"
	"time"
)

type Sensor struct {
	SensorID        string
	LocationName    string
	LocationAddress string
	Latitude        float64
	Longitude       float64
	IsActive        bool
}

type SensorReading struct {
	Time            time.Time
	SensorID        string
	Temperature     float64
	Humidity        float64
	VOCLevel        int
	AirQualityIndex int
	RiskLevel       string
}

// SensorCluster represents a group of sensors deployed in a specific area
type SensorCluster struct {
	Name         string
	CenterLat    float64
	CenterLng    float64
	RadiusKm     float64
	SensorCount  int
	LocationType string
}

// Define sensor clusters in bushfire-prone areas across Australia
// These areas have significant bushfire history and risk
var sensorClusters = []SensorCluster{
	{"Blue Mountains National Park", -33.7121, 150.3119, 25, 60, "forest"},
	{"Dandenong Ranges", -37.8339, 145.3508, 18, 50, "forest"},
	{"Adelaide Hills", -34.9285, 138.6007, 22, 55, "forest"},
	{"Yarra Ranges", -37.6883, 145.4617, 20, 50, "forest"},
	{"Kinglake National Park", -37.5167, 145.3167, 18, 55, "forest"},
	{"East Gippsland", -37.5000, 148.2500, 30, 60, "forest"},
	{"Grampians National Park", -37.2156, 142.5167, 25, 45, "forest"},
	{"Otway Ranges", -38.6616, 143.3901, 20, 40, "forest"},
	{"Perth Hills", -32.0500, 116.1000, 18, 50, "forest"},
	{"Margaret River Region", -33.9544, 115.0764, 22, 45, "forest"},
	{"Kangaroo Island", -35.7751, 137.2142, 28, 55, "coastal"},
	{"South Coast NSW", -36.2000, 150.1000, 25, 50, "coastal"},
	{"Shoalhaven Region", -35.0300, 150.4500, 20, 45, "forest"},
	{"Illawarra Escarpment", -34.4500, 150.8500, 15, 40, "forest"},
	{"Snowy Mountains", -36.4500, 148.2600, 30, 50, "forest"},
	{"Alpine National Park", -37.0833, 147.2500, 28, 50, "forest"},
	{"Ku-ring-gai Chase", -33.6500, 151.2000, 15, 45, "forest"},
	{"Royal National Park", -34.1333, 151.0500, 18, 50, "coastal"},
	{"Victorian High Country", -37.0500, 146.9000, 32, 60, "forest"},
	{"Macedon Ranges", -37.4167, 144.5833, 20, 45, "forest"},
}

func Run(conn *sql.DB) {
	log.Println("Starting sensor simulation...")

	// generate and insert 1000 sensors
	sensors := generateSensors(1000)
	if err := insertSensors(conn, sensors); err != nil {
		log.Printf("Error inserting sensors: %v", err)
		return
	}
	log.Printf("Successfully inserted %d sensors", len(sensors))

	// initialize sensor state map to track last readings
	sensorStates := make(map[string]*SensorReading)

	// backfill sensor reading data for the last month
	if err := backfillReadings(conn, sensors, sensorStates); err != nil {
		log.Printf("Error backfilling readings: %v", err)
		return
	}
	log.Println("Successfully backfilled historical sensor readings")

	// start continuous simulation with sensor states
	continuousSimulation(conn, sensors, sensorStates)
}

func generateSensors(count int) []Sensor {
	sensors := make([]Sensor, 0, count)

	sensorIndex := 1
	const sensorSpacingKm = 4.5

	// generate sensors for each cluster
	for _, cluster := range sensorClusters {
		clusterSensors := generateClusterSensors(cluster, sensorSpacingKm, &sensorIndex)
		sensors = append(sensors, clusterSensors...)

		if len(sensors) >= count {
			return sensors[:count]
		}
	}

	return sensors
}

// generateClusterSensors creates sensors in a hexagonal grid pattern within a cluster
// Hexagonal grids provide optimal coverage with minimal overlap
func generateClusterSensors(cluster SensorCluster, spacingKm float64, sensorIndex *int) []Sensor {
	sensors := make([]Sensor, 0, cluster.SensorCount)

	// calculate grid dimensions
	// hexagonal grid: rows are offset by half spacing
	gridSize := int(math.Ceil(math.Sqrt(float64(cluster.SensorCount))))

	for row := range gridSize {
		for col := range gridSize {
			if len(sensors) >= cluster.SensorCount {
				break
			}

			// hexagonal offset: odd rows shift by half spacing
			xOffset := float64(col) * spacingKm
			if row%2 == 1 {
				xOffset += spacingKm / 2
			}
			yOffset := float64(row) * spacingKm * 0.866

			// center the grid around cluster center
			gridCenterOffset := float64(gridSize-1) * spacingKm / 2
			xOffset -= gridCenterOffset
			yOffset -= gridCenterOffset * 0.866

			// add small random jitter (±200m) to make it look more natural
			jitterKm := (rand.Float64()*0.4 - 0.2) // ±200m
			xOffset += jitterKm
			yOffset += jitterKm

			// convert km offsets to lat/lng
			offsetLat := yOffset / 111.0
			offsetLng := xOffset / (111.0 * math.Cos(cluster.CenterLat*math.Pi/180))

			lat := cluster.CenterLat + offsetLat
			lng := cluster.CenterLng + offsetLng

			sensors = append(sensors, Sensor{
				SensorID:        fmt.Sprintf("AERO-%04d", *sensorIndex),
				LocationName:    cluster.Name,
				LocationAddress: fmt.Sprintf("Sensor %d in %s", len(sensors)+1, cluster.Name),
				Latitude:        math.Round(lat*1000000) / 1000000,
				Longitude:       math.Round(lng*1000000) / 1000000,
				IsActive:        true,
			})

			*sensorIndex++
		}
		if len(sensors) >= cluster.SensorCount {
			break
		}
	}

	return sensors
}

func insertSensors(conn *sql.DB, sensors []Sensor) error {
	ctx := context.Background()
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO sensors (sensor_id, location_name, location_address, location, is_active)
		VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
		ON CONFLICT (sensor_id) DO NOTHING
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, sensor := range sensors {
		_, err := stmt.Exec(
			sensor.SensorID,
			sensor.LocationName,
			sensor.LocationAddress,
			sensor.Longitude,
			sensor.Latitude,
			sensor.IsActive,
		)
		if err != nil {
			return fmt.Errorf("error inserting sensor %s: %w", sensor.SensorID, err)
		}
	}

	return tx.Commit()
}

func backfillReadings(conn *sql.DB, sensors []Sensor, sensorStates map[string]*SensorReading) error {
	now := time.Now()
	startTime := now.AddDate(0, -1, 0) // 1 month ago

	log.Printf("Backfilling readings from %s to %s", startTime.Format(time.RFC3339), now.Format(time.RFC3339))

	ctx := context.Background()
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO sensor_readings (time, sensor_id, temperature, humidity, voc_level, air_quality_index, risk_level)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	batchSize := 10000
	recordCount := 0

	// Generate readings every 5 minutes for each sensor
	for currentTime := startTime; currentTime.Before(now); currentTime = currentTime.Add(5 * time.Minute) {
		for _, sensor := range sensors {
			// Get previous reading for this sensor (if exists)
			prevReading := sensorStates[sensor.SensorID]

			// Generate new reading based on previous state
			reading := generateReading(sensor.SensorID, currentTime, prevReading)

			// Update sensor state
			sensorStates[sensor.SensorID] = &reading

			_, err := stmt.Exec(
				reading.Time,
				reading.SensorID,
				reading.Temperature,
				reading.Humidity,
				reading.VOCLevel,
				reading.AirQualityIndex,
				reading.RiskLevel,
			)
			if err != nil {
				return fmt.Errorf("error inserting reading: %w", err)
			}

			recordCount++

			// Commit in batches to avoid long transactions
			if recordCount%batchSize == 0 {
				if err := tx.Commit(); err != nil {
					return err
				}
				log.Printf("Inserted %d readings...", recordCount)

				// Start new transaction
				tx, err = conn.BeginTx(ctx, nil)
				if err != nil {
					return err
				}
				stmt.Close()
				stmt, err = tx.Prepare(`
					INSERT INTO sensor_readings (time, sensor_id, temperature, humidity, voc_level, air_quality_index, risk_level)
					VALUES ($1, $2, $3, $4, $5, $6, $7)
				`)
				if err != nil {
					return err
				}
			}
		}
	}

	log.Printf("Inserted total of %d readings", recordCount)
	return tx.Commit()
}

func continuousSimulation(conn *sql.DB, sensors []Sensor, sensorStates map[string]*SensorReading) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	log.Println("Starting continuous sensor reading simulation (every 5 minutes)...")

	for currentTime := range ticker.C {
		if err := insertCurrentReadings(conn, sensors, sensorStates, currentTime); err != nil {
			log.Printf("Error inserting current readings: %v", err)
		} else {
			log.Printf("Inserted readings for %s (%d sensors)", currentTime.Format(time.RFC3339), len(sensors))
		}
	}
}

func insertCurrentReadings(conn *sql.DB, sensors []Sensor, sensorStates map[string]*SensorReading, currentTime time.Time) error {
	ctx := context.Background()
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO sensor_readings (time, sensor_id, temperature, humidity, voc_level, air_quality_index, risk_level)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, sensor := range sensors {
		// Get previous reading for this sensor
		prevReading := sensorStates[sensor.SensorID]

		// Generate new reading based on previous state
		reading := generateReading(sensor.SensorID, currentTime, prevReading)

		// Update sensor state
		sensorStates[sensor.SensorID] = &reading

		_, err := stmt.Exec(
			reading.Time,
			reading.SensorID,
			reading.Temperature,
			reading.Humidity,
			reading.VOCLevel,
			reading.AirQualityIndex,
			reading.RiskLevel,
		)
		if err != nil {
			return fmt.Errorf("error inserting reading: %w", err)
		}
	}

	return tx.Commit()
}

func generateReading(sensorID string, timestamp time.Time, prevReading *SensorReading) SensorReading {
	// Generate realistic sensor data with temporal continuity
	// If prevReading exists, make small changes; otherwise start fresh

	hour := timestamp.Hour()
	var temperature, humidity float64
	var vocLevel, aqi int

	if prevReading == nil {
		// First reading for this sensor - generate initial state
		// Start most sensors in low risk state (80% chance)
		randScenario := rand.Float64()

		if randScenario < 0.80 {
			// Start in low risk
			temperature = 14.0 + rand.Float64()*6  // 14-20°C
			humidity = 60.0 + rand.Float64()*30    // 60-90%
			vocLevel = 30 + rand.Intn(60)          // 30-90 ppb
			aqi = 15 + rand.Intn(30)               // 15-45
		} else if randScenario < 0.95 {
			// Start in moderate risk
			temperature = 22.0 + rand.Float64()*6  // 22-28°C
			humidity = 35.0 + rand.Float64()*15    // 35-50%
			vocLevel = 150 + rand.Intn(120)        // 150-270 ppb
			aqi = 55 + rand.Intn(35)               // 55-90
		} else {
			// Start in high risk
			temperature = 30.0 + rand.Float64()*5  // 30-35°C
			humidity = 20.0 + rand.Float64()*10    // 20-30%
			vocLevel = 600 + rand.Intn(300)        // 600-900 ppb
			aqi = 110 + rand.Intn(40)              // 110-150
		}
	} else {
		// Evolve from previous reading with small changes
		temperature = prevReading.Temperature
		humidity = prevReading.Humidity
		vocLevel = prevReading.VOCLevel
		aqi = prevReading.AirQualityIndex

		// Small random walk for each parameter
		// Temperature: ±0.5-2°C per 5 minutes (realistic)
		tempChange := (rand.Float64()*4 - 2) // ±2°C max

		// Add daily temperature cycle (warmer during day)
		if hour >= 11 && hour <= 17 {
			tempChange += 0.3 // Slight warming trend during hot hours
		} else if hour >= 0 && hour <= 6 {
			tempChange -= 0.3 // Slight cooling trend at night
		}

		temperature += tempChange
		temperature = math.Max(8.0, math.Min(48.0, temperature)) // Clamp 8-48°C

		// Humidity: ±1-5% per 5 minutes (inverse to temperature)
		humidityChange := (rand.Float64()*6 - 3) - (tempChange * 0.5) // Inverse correlation
		humidity += humidityChange
		humidity = math.Max(10.0, math.Min(98.0, humidity)) // Clamp 10-98%

		// VOC: Can change more dramatically (smoke can appear quickly)
		// 70% small change, 20% medium change, 10% large change (fire starting)
		vocChange := 0
		vocRand := rand.Float64()

		if vocRand < 0.70 {
			// Small change: ±5-20 ppb
			vocChange = rand.Intn(40) - 20
		} else if vocRand < 0.90 {
			// Medium change: ±20-100 ppb
			vocChange = rand.Intn(200) - 100
		} else {
			// Large change: fire starting or clearing
			if vocLevel < 500 {
				// Fire starting - big increase
				vocChange = 300 + rand.Intn(700)
			} else {
				// Fire clearing - big decrease
				vocChange = -(200 + rand.Intn(400))
			}
		}

		vocLevel += vocChange
		vocLevel = int(math.Max(15.0, math.Min(3500.0, float64(vocLevel)))) // Clamp 15-3500 ppb

		// AQI: follows VOC with some lag
		aqiChange := vocChange / 10
		aqi += aqiChange
		aqi = int(math.Max(5.0, math.Min(400.0, float64(aqi)))) // Clamp 5-400
	}

	// Fire risk calculation based on NIH research formula
	// Fire Risk = W1·Temp + W2·(100-Humid) + W3·VOC + W4·AQI

	// Normalize values to 0-100 scale
	normalizedTemp := math.Min(100.0, math.Max(0.0, (temperature-10.0)*2.0))
	normalizedHumidity := 100.0 - humidity
	normalizedVOC := math.Min(100.0, float64(vocLevel)/30.0)
	normalizedAQI := math.Min(100.0, float64(aqi)/3.0)

	// Weighted fire risk score (0-100)
	// Weights: Temp 30%, Humidity 25%, VOC 30%, AQI 15%
	fireRiskScore := (0.30 * normalizedTemp) +
	                 (0.25 * normalizedHumidity) +
	                 (0.30 * normalizedVOC) +
	                 (0.15 * normalizedAQI)

	fireRiskScore = math.Min(100.0, fireRiskScore)

	// Determine risk level from calculated fire risk score
	var riskLevel string
	switch {
	case fireRiskScore >= 70:
		riskLevel = "critical"
	case fireRiskScore >= 55:
		riskLevel = "high"
	case fireRiskScore >= 40:
		riskLevel = "moderate"
	default:
		riskLevel = "low"
	}

	return SensorReading{
		Time:            timestamp,
		SensorID:        sensorID,
		Temperature:     math.Round(temperature*100) / 100,
		Humidity:        math.Round(humidity*100) / 100,
		VOCLevel:        vocLevel,
		AirQualityIndex: aqi,
		RiskLevel:       riskLevel,
	}
}
