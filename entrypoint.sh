#!/bin/bash

set -e
set -o pipefail

phantomjs-2.1.1-linux-x86_64/bin/phantomjs --cookies-file=cookies.txt generate_fb_token.js

echo '[EXCHANGE TOKEN] START:'
echo -n '[EXCHANGE TOKEN]   |- Send short-lived token to Facebook...'
shortLivedToken=$(cat /token/shortLivedAuthToken.txt)
url="https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_CLIENT_ID}&client_secret=${FB_CLIENT_SECRET}&fb_exchange_token=${shortLivedToken}"
response=$(curl --silent -X POST $url)
echo 'DONE.'

echo -n '[EXCHANGE TOKEN]   |- Parse long-lived token from response...'
echo $response | python3 -c 'import sys, json; print(json.load(sys.stdin)["access_token"])' > /token/longLivedAuthToken.txt
echo 'DONE.'
echo "[EXCHANGE TOKEN] DONE. (Saved long-lived token to file '/token/longLivedAuthToken.txt')"
