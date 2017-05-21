FROM ubuntu:14.04
MAINTAINER Stefanie Grunwald <docker@moertel.io>

RUN apt-get update && apt-get install -y \
    bzip2 \
    curl \
    libfontconfig \
    wget \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# PhantomJS
RUN wget -q -O /tmp/phantomjs-2.1.1-linux-x86_64.tar.bz2 https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
    && bzip2 -d /tmp/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
    && tar -xf /tmp/phantomjs-2.1.1-linux-x86_64.tar

COPY ./generate_fb_token.js /tmp/generate_fb_token.js
COPY ./entrypoint.sh /tmp/entrypoint.sh

# Workaround because of https://forums.docker.com/t/automated-docker-build-fails/22831/25
RUN cp -r /tmp/* / && rm -r /tmp

ENTRYPOINT ["./entrypoint.sh"]
