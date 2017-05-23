FROM ubuntu:14.04
LABEL maintainer "Stefanie Grunwald <docker@moertel.io>"

ARG BUILD_DATE
ARG VCS_REF
ARG VCS_URL
ARG VERSION

ENV FB_BUTTON_TEXT_GETTOKEN "Get Token"
ENV FB_BUTTON_TEXT_GETUSERACCESSTOKEN "Get User Access Token"
ENV FB_BUTTON_TEXT_GETACCESSTOKEN "Get Access Token"

LABEL org.label-schema.schema-version="1.0" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="Facebook Token Generator" \
      org.label-schema.description="Generate long-lived access tokens for Facebook without any manual interaction." \
      org.label-schema.vcs-url=$VCS_URL \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.version=$VERSION

RUN apt-get update && apt-get install -y \
    bzip2 \
    curl \
    libfontconfig \
    wget \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# PhantomJS
ENV PHANTOMJS_VERSION 2.1.1
RUN wget -q -O phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 \
    && bzip2 -d phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2 \
    && tar -xf phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar

COPY ./generate_fb_token.js generate_fb_token.js
COPY ./entrypoint.sh entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
