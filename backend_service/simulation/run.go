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
// Sensor counts vary from 4-15 per cluster
var sensorClusters = []SensorCluster{
	// NSW - Eastern Regions
	{"Blue Mountains National Park", -33.7121, 150.3119, 25, 12, "forest"},
	{"Ku-ring-gai Chase", -33.6500, 151.2000, 15, 8, "forest"},
	{"Royal National Park", -34.1333, 151.0500, 18, 10, "coastal"},
	{"Shoalhaven Region", -35.0300, 150.4500, 20, 9, "forest"},
	{"Illawarra Escarpment", -34.4500, 150.8500, 15, 7, "forest"},
	{"South Coast NSW", -36.2000, 150.1000, 25, 11, "coastal"},
	{"Snowy Mountains", -36.4500, 148.2600, 30, 13, "forest"},
	{"Central Coast NSW", -33.3000, 151.2000, 12, 6, "coastal"},
	{"Hunter Valley", -32.5000, 151.2000, 18, 9, "forest"},
	{"Barrington Tops", -31.9500, 151.5000, 20, 10, "forest"},
	{"Northern Rivers NSW", -28.8000, 153.2500, 15, 8, "forest"},
	{"Gibraltar Range", -29.5000, 152.3000, 18, 9, "forest"},
	{"New England Tablelands", -30.5000, 151.6500, 22, 11, "forest"},
	{"Warrumbungle Ranges", -31.2800, 149.0000, 20, 8, "forest"},

	// Victoria
	{"Dandenong Ranges", -37.8339, 145.3508, 18, 10, "forest"},
	{"Yarra Ranges", -37.6883, 145.4617, 20, 11, "forest"},
	{"Kinglake National Park", -37.5167, 145.3167, 18, 9, "forest"},
	{"East Gippsland", -37.5000, 148.2500, 30, 14, "forest"},
	{"Grampians National Park", -37.2156, 142.5167, 25, 12, "forest"},
	{"Otway Ranges", -38.6616, 143.3901, 20, 10, "forest"},
	{"Alpine National Park", -37.0833, 147.2500, 28, 13, "forest"},
	{"Victorian High Country", -37.0500, 146.9000, 32, 15, "forest"},
	{"Macedon Ranges", -37.4167, 144.5833, 20, 9, "forest"},
	{"Mornington Peninsula", -38.3667, 144.9833, 15, 7, "coastal"},
	{"Strzelecki Ranges", -38.5000, 146.3333, 18, 8, "forest"},

	// South Australia
	{"Adelaide Hills", -34.9285, 138.6007, 22, 11, "forest"},
	{"Kangaroo Island", -35.7751, 137.2142, 28, 13, "coastal"},
	{"Flinders Ranges", -31.5000, 138.6500, 35, 15, "desert"},
	{"Mount Lofty Ranges", -34.9833, 138.7167, 18, 9, "forest"},
	{"Barossa Valley", -34.5500, 138.9833, 15, 7, "forest"},
	{"Yorke Peninsula", -34.5000, 137.5000, 20, 8, "coastal"},
	{"Eyre Peninsula", -33.5000, 135.8333, 25, 10, "coastal"},

	// Western Australia
	{"Perth Hills", -32.0500, 116.1000, 18, 9, "forest"},
	{"Margaret River Region", -33.9544, 115.0764, 22, 10, "forest"},
	{"Stirling Range", -34.3833, 118.0667, 20, 9, "forest"},
	{"Porongurup Range", -34.6667, 117.8667, 12, 5, "forest"},
	{"Denmark Region", -34.9600, 117.3500, 15, 7, "coastal"},
	{"Darling Scarp", -32.4000, 116.2000, 18, 8, "forest"},
	{"Kimberley Region", -17.5000, 124.5000, 40, 12, "desert"},
	{"Pilbara Region", -22.0000, 118.0000, 35, 11, "desert"},
	{"Esperance Hinterland", -33.8667, 121.8917, 20, 8, "coastal"},

	// Queensland
	{"Sunshine Coast Hinterland", -26.6500, 152.9500, 15, 8, "forest"},
	{"Noosa Hinterland", -26.4000, 152.9500, 12, 6, "forest"},
	{"Gold Coast Hinterland", -28.2000, 153.2500, 18, 9, "forest"},
	{"Scenic Rim", -28.1000, 152.7000, 20, 10, "forest"},
	{"D'Aguilar Range", -27.3333, 152.7500, 15, 7, "forest"},
	{"Carnarvon Gorge", -25.0000, 148.2000, 25, 9, "forest"},
	{"Whitsunday Coast", -20.2800, 148.7167, 18, 8, "coastal"},
	{"Atherton Tablelands", -17.2667, 145.4667, 20, 9, "forest"},

	// Tasmania
	{"Tasmania Wilderness", -42.5000, 146.5000, 30, 14, "forest"},
	{"Cradle Mountain", -41.6500, 145.9500, 25, 11, "forest"},
	{"Freycinet Peninsula", -42.1333, 148.3000, 18, 8, "coastal"},
	{"Mount Wellington", -42.8900, 147.2400, 15, 7, "forest"},
	{"Huon Valley", -43.0333, 146.9667, 20, 9, "forest"},

	// Central Australia / Northern Territory
	{"Alice Springs Region", -23.7000, 133.8807, 30, 10, "desert"},
	{"MacDonnell Ranges", -23.6667, 133.0000, 35, 12, "desert"},
	{"Uluru-Kata Tjuta", -25.3444, 131.0369, 25, 8, "desert"},
	{"Tanami Desert Edge", -20.0000, 130.0000, 40, 9, "desert"},
	{"Simpson Desert Edge", -25.5000, 137.5000, 35, 8, "desert"},
	{"Kakadu National Park", -12.6500, 132.8833, 30, 13, "forest"},
	{"Arnhem Land", -12.5000, 134.0000, 35, 11, "forest"},
	{"Katherine Region", -14.4650, 132.2650, 25, 9, "desert"},
	{"Finke Gorge", -24.1000, 132.7500, 20, 6, "desert"},

	// ACT
	{"Canberra Bushland", -35.2809, 149.1300, 15, 8, "forest"},
	{"Namadgi National Park", -35.6167, 148.9833, 20, 10, "forest"},
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
	startTime := now.AddDate(0, 0, -1) // 1 day prior

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
	minuteCounter := 0

	// Generate readings every 1 minute for each sensor
	for currentTime := startTime; currentTime.Before(now); currentTime = currentTime.Add(1 * time.Minute) {
		minuteCounter++

		// Pick exactly 1 random sensor to force into critical state every 2 minutes
		var forceCriticalIndex int = -1
		if minuteCounter%2 == 0 {
			// Only pick sensors that are NOT already critical
			var nonCriticalIndices []int
			for i, sensor := range sensors {
				prevReading := sensorStates[sensor.SensorID]
				if prevReading == nil || prevReading.RiskLevel != "critical" {
					nonCriticalIndices = append(nonCriticalIndices, i)
				}
			}

			if len(nonCriticalIndices) > 0 {
				// Pick random non-critical sensor to force critical
				forceCriticalIndex = nonCriticalIndices[rand.Intn(len(nonCriticalIndices))]
			}
		}

		for i, sensor := range sensors {
			// Get previous reading for this sensor (if exists)
			prevReading := sensorStates[sensor.SensorID]

			// Generate new reading based on previous state
			forceCritical := (i == forceCriticalIndex)
			reading := generateReading(sensor.SensorID, currentTime, prevReading, forceCritical)

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
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	log.Println("Starting continuous sensor reading simulation (every 1 minute)...")

	minuteCounter := 0
	for currentTime := range ticker.C {
		minuteCounter++
		forceFireThisMinute := (minuteCounter%2 == 0)

		if err := insertCurrentReadings(conn, sensors, sensorStates, currentTime, forceFireThisMinute); err != nil {
			log.Printf("Error inserting current readings: %v", err)
		} else {
			log.Printf("Inserted readings for %s (%d sensors)", currentTime.Format(time.RFC3339), len(sensors))
		}
	}
}

func insertCurrentReadings(conn *sql.DB, sensors []Sensor, sensorStates map[string]*SensorReading, currentTime time.Time, forceFireThisMinute bool) error {
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

	// Pick exactly 1 random sensor to force into critical state (fire start)
	// Only happens every 2 minutes (when forceFireThisMinute is true)
	var forceCriticalIndex int = -1
	if forceFireThisMinute {
		// Only pick sensors that are NOT already critical
		var nonCriticalIndices []int
		for i, sensor := range sensors {
			prevReading := sensorStates[sensor.SensorID]
			if prevReading == nil || prevReading.RiskLevel != "critical" {
				nonCriticalIndices = append(nonCriticalIndices, i)
			}
		}

		if len(nonCriticalIndices) > 0 {
			// Pick random non-critical sensor to force critical
			forceCriticalIndex = nonCriticalIndices[rand.Intn(len(nonCriticalIndices))]
		}
	}

	for i, sensor := range sensors {
		// Get previous reading for this sensor
		prevReading := sensorStates[sensor.SensorID]

		// Generate new reading based on previous state
		forceCritical := (i == forceCriticalIndex)
		reading := generateReading(sensor.SensorID, currentTime, prevReading, forceCritical)

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

func generateReading(sensorID string, timestamp time.Time, prevReading *SensorReading, forceCritical bool) SensorReading {
	var temperature, humidity float64
	var vocLevel, aqi int

	// Force critical state if requested (guaranteed fire start)
	if forceCritical && prevReading != nil && prevReading.RiskLevel != "critical" {
		// Force transition to critical state
		temperature = 36.0 + rand.Float64()*7.0 // 36-43°C
		humidity = 15.0 + rand.Float64()*10.0   // 15-25%
		vocLevel = 1400 + rand.Intn(1100)       // 1400-2500 ppb
		aqi = 180 + rand.Intn(100)              // 180-280
	} else if prevReading == nil {
		// First reading - always start in normal low risk conditions
		temperature = 16.0 + rand.Float64()*6.0 // 16-22°C
		humidity = 60.0 + rand.Float64()*25.0   // 60-85%
		vocLevel = 25 + rand.Intn(50)           // 25-75 ppb
		aqi = 15 + rand.Intn(25)                // 15-40
	} else {
		// Evolve from previous reading with smooth, natural changes (per minute)
		temperature = prevReading.Temperature
		humidity = prevReading.Humidity
		vocLevel = prevReading.VOCLevel
		aqi = prevReading.AirQualityIndex

		// Temperature: very small gradual change ±0.1-0.3°C per minute
		tempChange := (rand.Float64()*0.6 - 0.3)
		temperature += tempChange
		temperature = math.Max(10.0, math.Min(45.0, temperature))

		// Humidity: small gradual change ±0.2-0.5% per minute
		humidityChange := (rand.Float64()*1.0 - 0.5)
		humidity += humidityChange
		humidity = math.Max(15.0, math.Min(95.0, humidity))

		// VOC: small drift ±2-8 ppb per minute for normal conditions
		vocChange := rand.Intn(16) - 8

		// If in critical state, gradually decrease VOC (fire clearing)
		if prevReading.RiskLevel == "critical" {
			vocChange = -(50 + rand.Intn(100)) // -50 to -150 ppb per minute
		}

		vocLevel += vocChange
		vocLevel = int(math.Max(20.0, math.Min(3000.0, float64(vocLevel))))

		// AQI: follows VOC changes
		aqi = vocLevel / 10
		aqi = int(math.Max(10.0, math.Min(350.0, float64(aqi))))
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
