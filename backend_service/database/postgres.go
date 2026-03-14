// Package database is responsible for database connections to the app
package database

import (
	"context"
	"database/sql"
	"log"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func NewPgPool(dsn string) (*sql.DB, error) {
	// open connection using pgx driver
	conn, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}

	// configure connection pool settings
	// maximum number of open connections to the database
	conn.SetMaxOpenConns(25)
	// maximum number of connections in the idle connection pool
	conn.SetMaxIdleConns(5)
	// maximum amount of time a connection may be reused
	conn.SetConnMaxLifetime(time.Hour)
	// maximum amount of time a connection may be idle
	conn.SetConnMaxIdleTime(30 * time.Minute)

	// test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err = conn.PingContext(ctx); err != nil {
		conn.Close()
		return nil, err
	}

	log.Println("successfully connected to postgresql")
	return conn, nil
}
