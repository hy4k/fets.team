#!/bin/bash
# Run this AFTER you've executed schema.sql in Supabase SQL Editor
# This inserts the super_admin profile for midhunnr@gmail.com

SRK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZXhrdWZteHFmbnpsYnJkbWhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3OTg4MywiZXhwIjoyMDg3MDU1ODgzfQ.AGQLHcXFq00PdDp5KscV8ZBPLvuDVhcCEqfOBI9qgFQ"
USER_ID="1185f2cd-a5ec-47a2-a6fc-cd5701333e56"

echo "Creating admin profile..."
curl -s -X POST "https://duexkufmxqfnzlbrdmhc.supabase.co/rest/v1/profiles" \
  -H "Authorization: Bearer $SRK" \
  -H "apikey: $SRK" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{
    \"id\": \"$USER_ID\",
    \"full_name\": \"Midhun N R\",
    \"role\": \"super_admin\",
    \"is_active\": true
  }"

echo ""
echo "Done! You can now log in at https://fets.team with:"
echo "  Email:    midhunnr@gmail.com"
echo "  Password: FetsAdmin@2024!"
