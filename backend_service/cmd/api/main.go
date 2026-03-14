package main

import (
	"log"
	"os"

	"github.com/fraeso/smiskis/database"
	"github.com/fraeso/smiskis/simulation"
	_ "github.com/joho/godotenv/autoload"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	// get envs
	wsAddr, dsn := getEnvs()
	println(wsAddr)
	println(dsn)

	// TODO: try to connect to db with pooling
	_, err := database.NewPgPool(dsn)
	if err != nil {
		log.Fatal(err)
	}

	// TODO: try to migrate db based on migration files
	m, err := migrate.New("file://migrations", dsn)
	if err != nil {
		log.Fatal(err)
	}
	if err := m.Up(); err != nil {
		log.Fatal(err)
	}
	// run goroutine to continuously simulate/generate and write to db
	//
	// simulates sensor data coming through mqtt and being written to database
	// continuously
	//
	// simulation also creates dummy sensors in different areas of Australia
	go simulation.Run()

	// TODO: start ws server for live alerts
	// TODO: start http server for data polling endpoints
}

// TODO: maybe check empty env values lol
func getEnvs() (wsAddr, dsn string) {
	wsAddr = os.Getenv("WS_ADDR")
	dsn = os.Getenv("DB_URL")

	log.Println("WS_ADDR=", wsAddr)
	log.Println("DB_URL=", dsn)

	return
}
