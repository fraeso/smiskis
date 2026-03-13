package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/joho/godotenv/autoload"
)

func main() {
	addr, dsn := getEnvs()
	println(addr)
	println(dsn)

	http.HandleFunc("/health", greet)
	http.ListenAndServe(addr, nil)
}

func greet(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello World! %s", time.Now())
}

// TODO: maybe check empty env values lol
func getEnvs() (addr, dsn string) {
	addr = os.Getenv("ADDR")
	dsn = os.Getenv("DB_URL")

	log.Println("ADDR=", addr)
	log.Println("DB_URL=", dsn)

	return
}
