// Package database is responsible for database connections to the app
package database

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPgPool(dsn string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}

	// configure connection pool settings
	// maximum number of connections in the pool
	config.MaxConns = 25
	// minimum number of connections to keep open
	config.MinConns = 5
	// maximum lifetime of a connection
	config.MaxConnLifetime = time.Hour
	// maximum idle time before closing
	config.MaxConnIdleTime = 30 * time.Minute
	// how often to check connection health
	config.HealthCheckPeriod = 1 * time.Minute

	// create the pool
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	// test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err = pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	log.Println("successfully connected to postgresql")
	return pool, nil
}
