## Build to JS
```
$ npm run build
```

## Run app based on PM2
```
$ pm2 start app.ts --interpreter /usr/bin/ts-node
```

## Nginx Reverse Proxy
```
location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_pass http://127.0.0.1:3000;
}
```

## Create .env file with API Token like .env-sample file shows
```
PORT=3000
OPENAI_API_KEY="" <=== Insert Token Here
MODEL="gpt-3.5-turbo"
```