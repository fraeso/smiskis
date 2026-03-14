package main

import (
	"log"
	"net/http"
	"os"

	"github.com/fraeso/smiskis/database"
	"github.com/fraeso/smiskis/monitor"
	"github.com/fraeso/smiskis/repository"
	srv "github.com/fraeso/smiskis/server/http"
	"github.com/fraeso/smiskis/websocket"

	"github.com/fraeso/smiskis/simulation"
	_ "github.com/joho/godotenv/autoload"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	// get envs
	httpAddr, wsAddr, dsn := getEnvs()

	// connect to db with pooling
	conn, err := database.NewPgPool(dsn)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Database connection established")

	// migrate db based on migration files
	m, err := migrate.New("file://migrations", dsn)
	if err != nil {
		log.Fatal(err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatal(err)
	}
	log.Println("Database migrations completed successfully")

	// initialize repositories
	sensorRepo := repository.NewSensorRepository(conn)

	// create router with all middlewares and routes
	router := srv.NewRouter(sensorRepo)

	// create WebSocket hub for broadcasting fire alerts
	hub := websocket.NewHub()
	go hub.Run()
	log.Println("WebSocket hub started")

	// start http server for data polling endpoints in a goroutine
	go func() {
		log.Printf("Starting HTTP server on %s", httpAddr)
		if err := http.ListenAndServe(httpAddr, router); err != nil {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	// start WebSocket server for live alerts
	go func() {
		http.HandleFunc("/ws", websocket.HandleWebSocket(hub))
		log.Printf("Starting WebSocket server on %s", wsAddr)
		if err := http.ListenAndServe(wsAddr, nil); err != nil {
			log.Fatalf("WebSocket server failed: %v", err)
		}
	}()

	// start fire monitoring service in a goroutine (uses separate connection for LISTEN)
	go monitor.StartFireMonitor(dsn, hub)

	// run simulation to continuously generate and write sensor data to db
	//
	// simulates sensor data coming through mqtt and being written to database
	// continuously
	//
	// simulation also creates dummy sensor clusters in different areas of Australia
	simulation.Run(conn)
}

func getEnvs() (httpAddr, wsAddr, dsn string) {
	httpAddr = os.Getenv("HTTP_ADDR")
	if httpAddr == "" {
		httpAddr = ":8080" // default port
	}

	wsAddr = os.Getenv("WS_ADDR")
	if wsAddr == "" {
		wsAddr = ":8081" // default port
	}

	dsn = os.Getenv("DB_URL")

	log.Println("HTTP_ADDR=", httpAddr)
	log.Println("WS_ADDR=", wsAddr)
	log.Println("DB_URL=", dsn)

	return
}
