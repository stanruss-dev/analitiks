#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"
cp prisma/dev.db "$BACKUP_DIR/dev_$TIMESTAMP.db"
echo "Резервная копия создана: $BACKUP_DIR/dev_$TIMESTAMP.db"
