FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    HOME=/home/codespace

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      xz-utils \
      libgnutls30 \
      fontconfig \
      libfreetype6 \
      libx11-6 \
      libxext6 \
      libxi6 \
      libxrender1 \
      libxcursor1 \
      libxrandr2 \
      libxinerama1 \
      libxfixes3 \
      libxxf86vm1 \
      libgl1 \
      libglu1-mesa \
      libasound2 \
      libopenal1 \
      libpulse0 \
      libudev1 \
      libdbus-1-3 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libgtk-3-0 \
      libjpeg62-turbo \
      libpng16-16 \
      libtiff6 \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL \
      https://github.com/LiteLDev/lip/releases/download/v0.44.0/lip-0.44.0-linux-x64.tar.xz \
      -o /tmp/lip.tar.xz \
    && tar -xJf /tmp/lip.tar.xz -C /usr/local/bin --strip-components=1 ./lip \
    && chmod +x /usr/local/bin/lip \
    && rm -f /tmp/lip.tar.xz

RUN mkdir -p /home/codespace/.cache/fontconfig /home/codespace/.local/share/lip \
    && chown -R 1000:1000 /home/codespace
WORKDIR /app
CMD ["lip", "run"]
