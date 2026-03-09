#!/bin/bash
set -a
source test-scripts/performance/.env
set +a
./k6 run --out xk6-influxdb=$K6_INFLUXDB_ADDR $1