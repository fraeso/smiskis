package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/fraeso/smiskis/repository"
)

type SensorHandler struct {
	repo repository.SensorRepository
}

// NewSensorHandler creates a new sensor handler
func NewSensorHandler(repo repository.SensorRepository) *SensorHandler {
	return &SensorHandler{repo: repo}
}

type Location struct {
	Name    string  `json:"name"`
	Address string  `json:"address"`
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
}

type Readings struct {
	Temperature     float64 `json:"temperature"`
	Humidity        float64 `json:"humidity"`
	VOCLevel        int     `json:"vocLevel"`
	AirQualityIndex int     `json:"airQualityIndex"`
}

type SensorResponse struct {
	SensorID  string    `json:"sensorId"`
	Location  Location  `json:"location"`
	Readings  Readings  `json:"readings"`
	RiskLevel string    `json:"riskLevel"`
	Timestamp time.Time `json:"timestamp"`
}

// GetLatestReadings returns the most recent reading from every sensor
func (h *SensorHandler) GetLatestReadings(w http.ResponseWriter, r *http.Request) {
	readings, err := h.repo.GetLatestReadings()
	if err != nil {
		log.Printf("Error getting latest readings: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Transform repository data to API response format
	responses := make([]SensorResponse, 0, len(readings))
	for _, reading := range readings {
		responses = append(responses, SensorResponse{
			SensorID: reading.SensorID,
			Location: Location{
				Name:    reading.LocationName,
				Address: reading.LocationAddress,
				Lat:     reading.Latitude,
				Lng:     reading.Longitude,
			},
			Readings: Readings{
				Temperature:     reading.Temperature,
				Humidity:        reading.Humidity,
				VOCLevel:        reading.VOCLevel,
				AirQualityIndex: reading.AirQualityIndex,
			},
			RiskLevel: reading.RiskLevel,
			Timestamp: reading.Timestamp,
		})
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(responses); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("Returned %d sensor readings", len(responses))
}
