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

# Workaround because of https://forums.docker.com/t/automated-docker-build-fails/22831/25
RUN cp -r /tmp/* / && rm -r /tmp

CMD ./phantomjs-2.1.1-linux-x86_64/bin/phantomjs --cookies-file=cookies.txt generate_fb_token.js \
    && curl -s -X POST \
       $(export FB_CLIENT_ID=${FB_CLIENT_ID} \
          && export FB_CLIENT_SECRET=${FB_CLIENT_SECRET} \
          && cat /token/shortLivedAuthToken.txt \
          | awk '{print "https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id="ENVIRON["FB_CLIENT_ID"]"&client_secret="ENVIRON["FB_CLIENT_SECRET"]"&fb_exchange_token="$1}') \
       | awk -F'=' '{print $2}' \
       | awk -F'&' '{print $1}' \
       > /token/longLivedAuthToken.txt
