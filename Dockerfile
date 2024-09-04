# Step 1: Use the official Deno image from Docker Hub
FROM denoland/deno:alpine-1.38.3

RUN apk update && apk add curl

RUN curl -fsSL https://deno.land/x/install/install.sh | sh && mv /root/.deno/bin/deno /bin/deno

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy the necessary files
# Copy the import map and Deno configuration file first
COPY import_map.json deno.jsonc herald.yaml utils ./

# Step 4: Cache the dependencies using the import map
# RUN deno cache --import-map=import_map.json

# Step 5: Copy the rest of the application code
COPY ./src ./src

RUN deno cache ./src/main.ts

ENTRYPOINT ["deno"]

# Step 6: Set the default command to run the application using the import map
CMD ["task", "start"]
