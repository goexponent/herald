FROM denoland/deno:alpine-1.38.3

RUN apk update && apk add curl && curl -fsSL https://deno.land/x/install/install.sh | sh && mv /root/.deno/bin/deno /bin/deno

WORKDIR /app

COPY import_map.json deno.jsonc herald-compose.yaml utils ./

COPY ./src ./src

RUN deno cache ./src/main.ts

ENTRYPOINT ["deno"]
CMD ["task", "start"]
