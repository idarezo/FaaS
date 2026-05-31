#!/bin/bash
# Zagon lokalnega razvoja za FaaS Events
# Uporaba: ./scripts/start-local.sh

echo "=== FaaS Events - Lokalni zagon ==="

# 1. Zaženi DynamoDB Local
echo ""
echo "1. Zaganjam DynamoDB Local na portu 8000..."
java -Djava.library.path=.dynamodb/DynamoDBLocal_lib \
     -jar .dynamodb/DynamoDBLocal.jar \
     -sharedDb -inMemory -port 8000 &
DYNAMO_PID=$!
echo "   DynamoDB PID: $DYNAMO_PID"

# Počakaj, da se DynamoDB Local zažene
sleep 3

# 2. Ustvari tabele
echo ""
echo "2. Ustvarjam DynamoDB tabele..."
node scripts/setup-local.js

# 3. Zaženi serverless offline
echo ""
echo "3. Zaganjam Serverless Offline na portu 3000..."
echo "   Endpointi dostopni na: http://localhost:3000/local"
echo ""
npx serverless offline start --stage local

# Čiščenje ob zaustavitvi
trap "kill $DYNAMO_PID 2>/dev/null; echo 'DynamoDB Local zaustavljen'" EXIT