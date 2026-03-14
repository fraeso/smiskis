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

	// initialise sensor state map to track last readings
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
		// More varied starting distribution: 65% low, 20% moderate, 10% high, 5% critical
		randScenario := rand.Float64()

		if randScenario < 0.65 {
			// Start in low risk
			temperature = 14.0 + rand.Float64()*6 // 14-20°C
			humidity = 60.0 + rand.Float64()*30   // 60-90%
			vocLevel = 30 + rand.Intn(60)         // 30-90 ppb
			aqi = 15 + rand.Intn(30)              // 15-45
		} else if randScenario < 0.85 {
			// Start in moderate risk
			temperature = 22.0 + rand.Float64()*6 // 22-28°C
			humidity = 35.0 + rand.Float64()*15   // 35-50%
			vocLevel = 150 + rand.Intn(120)       // 150-270 ppb
			aqi = 55 + rand.Intn(35)              // 55-90
		} else if randScenario < 0.95 {
			// Start in high risk
			temperature = 30.0 + rand.Float64()*6 // 30-36°C
			humidity = 20.0 + rand.Float64()*12   // 20-32%
			vocLevel = 600 + rand.Intn(400)       // 600-1000 ppb
			aqi = 110 + rand.Intn(50)             // 110-160
		} else {
			// Start in critical risk (fires already burning)
			temperature = 35.0 + rand.Float64()*8 // 35-43°C
			humidity = 12.0 + rand.Float64()*10   // 12-22%
			vocLevel = 1200 + rand.Intn(1200)     // 1200-2400 ppb
			aqi = 180 + rand.Intn(100)            // 180-280
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
		// 55% small change, 20% medium change, 25% large change/fire events
		vocChange := 0
		vocRand := rand.Float64()

		if vocRand < 0.55 {
			// Small change: ±5-30 ppb (normal drift)
			vocChange = rand.Intn(60) - 30
		} else if vocRand < 0.75 {
			// Medium change: ±50-200 ppb (smoke drifting in/out)
			vocChange = rand.Intn(400) - 200
		} else {
			// Large change: fire events (25% chance)
			if vocLevel < 1200 {
				// Fire starting or intensifying - dramatic increase
				vocChange = 800 + rand.Intn(1700) // +800 to +2500 ppb (more intense)

				// Also spike temperature during fire events
				temperature += 8.0 + rand.Float64()*12.0 // +8 to +20°C (hotter)
				temperature = math.Min(48.0, temperature)

				// Drop humidity during fire
				humidity -= 15.0 + rand.Float64()*25.0 // -15 to -40% (drier)
				humidity = math.Max(10.0, humidity)
			} else if vocLevel > 2000 {
				// Only clear if VOC is very high (fire sustained longer)
				vocChange = -(200 + rand.Intn(400)) // -200 to -600 ppb (slower clearing)

				// Temperature and humidity recover very slowly
				temperature -= 1.0 + rand.Float64()*2.0
				temperature = math.Max(8.0, temperature)

				humidity += 2.0 + rand.Float64()*8.0
				humidity = math.Min(98.0, humidity)
			} else {
				// Medium VOC (1200-2000): fire persists but can naturally extinguish
				// 90% sustain, 10% start clearing (rain, wind change, firefighters)
				// Average fire duration: ~50 minutes, some last hours
				if rand.Float64() < 0.90 {
					// Fire persists with small fluctuations
					vocChange = rand.Intn(400) - 200 // ±200 ppb
				} else {
					// Natural extinguishing - significant drop
					vocChange = -(400 + rand.Intn(600)) // -400 to -1000 ppb

					// Conditions improve (rain, wind change)
					temperature -= 3.0 + rand.Float64()*5.0
					temperature = math.Max(8.0, temperature)

					humidity += 10.0 + rand.Float64()*20.0
					humidity = math.Min(98.0, humidity)
				}
			}
		}

		vocLevel += vocChange
		vocLevel = int(math.Max(15.0, math.Min(3500.0, float64(vocLevel)))) // Clamp 15-3500 ppb

		// AQI: follows VOC more closely
		aqiChange := vocChange / 8 // More responsive to VOC changes
		aqi += aqiChange
		aqi = int(math.Max(5.0, math.Min(400.0, float64(aqi)))) // Clamp 5-400
	}

	// Fire risk calculation based on NIH research formula
	// Fire Risk = W1·Temp + W2·(100-Humid) + W3·VOC + W4·AQI

	// Normalise values to 0-100 scale
	normalisedTemp := math.Min(100.0, math.Max(0.0, (temperature-10.0)*2.0))
	normalisedHumidity := 100.0 - humidity
	normalisedVOC := math.Min(100.0, float64(vocLevel)/30.0)
	normalisedAQI := math.Min(100.0, float64(aqi)/3.0)

	// Weighted fire risk score (0-100)
	// Weights: Temp 30%, Humidity 25%, VOC 30%, AQI 15%
	fireRiskScore := (0.30 * normalisedTemp) +
		(0.25 * normalisedHumidity) +
		(0.30 * normalisedVOC) +
		(0.15 * normalisedAQI)

	fireRiskScore = math.Min(100.0, fireRiskScore)

	// Determine risk level from calculated fire risk score
	var riskLevel string
	switch {
	case fireRiskScore >= 65:
		riskLevel = "critical"
	case fireRiskScore >= 50:
		riskLevel = "high"
	case fireRiskScore >= 35:
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
