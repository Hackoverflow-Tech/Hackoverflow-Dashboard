name: Daily Database Backup

on:
  schedule:
    # Every day at 2:00 AM UTC — adjust to your timezone
    # UTC+5:30 (IST): 2:00 AM UTC = 7:30 AM IST
    - cron: '0 2 * * *'
  # Lets you trigger a manual backup anytime from the Actions tab
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger backup endpoint
        run: |
          echo "Triggering backup at $(date -u)"

          HTTP_STATUS=$(curl -s -o response.json -w "%{http_code}" \
            --max-time 60 \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.APP_URL }}/api/backup")

          echo "HTTP status: $HTTP_STATUS"
          echo "Response:"
          cat response.json

          if [ "$HTTP_STATUS" != "200" ]; then
            echo "Backup failed with HTTP $HTTP_STATUS"
            exit 1
          fi

          echo "Backup succeeded"