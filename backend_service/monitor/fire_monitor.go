package monitor

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

var alertCounter int = 0

type FireAlert struct {
	SensorID        string    `json:"sensor_id"`
	LocationName    string    `json:"location_name"`
	Timestamp       time.Time `json:"timestamp"`
	Temperature     float64   `json:"temperature"`
	Humidity        float64   `json:"humidity"`
	VOCLevel        int       `json:"voc_level"`
	AirQualityIndex int       `json:"air_quality_index"`
	PreviousRisk    string    `json:"previous_risk_level"`
	CurrentRisk     string    `json:"current_risk_level"`
}

// StartFireMonitor listens to PostgreSQL notifications for real-time fire alerts
func StartFireMonitor(dsn string) {
	log.Println("Starting real-time fire monitoring service...")

	ctx := context.Background()

	// Create a dedicated connection for LISTEN/NOTIFY
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database for fire monitoring: %v", err)
	}
	defer conn.Close(ctx)

	// Start listening on the 'fire_alert' channel
	_, err = conn.Exec(ctx, "LISTEN fire_alert")
	if err != nil {
		log.Fatalf("Failed to start listening on fire_alert channel: %v", err)
	}

	log.Println("✅ Fire monitor is now listening for fire alerts...")

	// Listen for notifications indefinitely
	for {
		notification, err := conn.WaitForNotification(ctx)
		if err != nil {
			// Check if connection was closed
			if ctx.Err() != nil {
				log.Println("Fire monitor context cancelled, shutting down...")
				return
			}
			log.Printf("Error waiting for notification: %v", err)

			// Try to reconnect
			time.Sleep(5 * time.Second)
			continue
		}

		handleFireAlert(notification)
	}
}

type AlertLog struct {
	ID           string   `json:"id"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	Severity     string   `json:"severity"`
	Locations    []string `json:"locations"`
	Time         string   `json:"time"`
	Timestamp    string   `json:"timestamp"`
	CallToAction string   `json:"callToAction"`
}

func handleFireAlert(notification *pgconn.Notification) {
	var alert FireAlert

	// Parse the JSON payload
	err := json.Unmarshal([]byte(notification.Payload), &alert)
	if err != nil {
		log.Printf("Error parsing fire alert payload: %v", err)
		return
	}

	// Increment alert counter
	alertCounter++
	alertID := fmt.Sprintf("ALERT-%03d", alertCounter)

	// Build alert log structure
	alertLog := AlertLog{
		ID:           alertID,
		Title:        "High Fire Risk Detected",
		Description:  fmt.Sprintf("Fire ignition conditions detected at %s (Sensor %s). VOC: %d ppb, Temp: %.1f°C, Humidity: %.1f%%.", alert.LocationName, alert.SensorID, alert.VOCLevel, alert.Temperature, alert.Humidity),
		Severity:     "critical",
		Locations:    []string{alert.LocationName},
		Time:         "Just now",
		Timestamp:    alert.Timestamp.Format(time.RFC3339),
		CallToAction: "Call Triple Zero (000) if affected",
	}

	// Serialize to JSON
	alertJSON, err := json.MarshalIndent(alertLog, "", "  ")
	if err != nil {
		log.Printf("Error serializing alert: %v", err)
		return
	}

	log.Println("🔥 FIRE STARTED!")
	log.Println(string(alertJSON))
}
