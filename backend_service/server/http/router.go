package server

import (
	"net/http"
	"time"

	"github.com/fraeso/smiskis/handlers"
	"github.com/fraeso/smiskis/repository"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// NewRouter creates and configures the chi router with all middlewares and routes
func NewRouter(sensorRepo repository.SensorRepository) http.Handler {
	r := chi.NewRouter()

	// Middlewares
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS middleware configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Initialise handlers
	sensorHandler := handlers.NewSensorHandler(sensorRepo)

	// Routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/sensors/latest", sensorHandler.GetLatestReadings)
	})

	return r
}
