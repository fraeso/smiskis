# Stage 1: Build the Go binary
FROM golang:1.26.1-bookworm AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum first to leverage Docker caching for dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the Go application, making it statically linked (CGO_ENABLED=0)
# and placing the binary in /app/server
RUN CGO_ENABLED=0 go build -v -o /app/server ./...

# Stage 2: Create a minimal runtime image
# Use the "scratch" base image for the absolute smallest possible image
FROM scratch

# Copy only the compiled binary from the 'builder' stage
COPY --from=builder /app/server /server

# Command to run the executable when the container starts
ENTRYPOINT ["/server"]
