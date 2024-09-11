FROM denoland/deno:alpine-1.46.3

WORKDIR /app

COPY import_map.json deno.jsonc herald-compose.yaml utils ./

COPY ./src ./src

RUN deno cache ./src/main.ts

ENTRYPOINT ["deno"]
CMD ["task", "start"]
