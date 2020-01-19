# Bigbrother Log System

## Usage

1. start solr server
```bash
docker-compose up -d
```

2. build portal
```bash
cd portal
npm i
npm run-script build
```

3. start webserver
```bash
npm i
node server/webserver.js
```
