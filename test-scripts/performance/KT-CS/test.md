curl -i -X POST 'http://localhost:8000/api/v3/seed/members' \
    -H 'Content-Type: application/json' \
    -d '{
      "count": 1,
      "prefix": "test",
      "emailDomain": "test.com",
      "password": "Lawform!2026",
      "teamName": "KTCS",
      "planCode": "여기에_기존_플랜_코드"
    }'