# Facebook Token Generator

[![Docker Automated build](https://img.shields.io/docker/automated/moertel/facebook-token-generator.svg)](https://hub.docker.com/r/moertel/facebook-token-generator) &nbsp; [![](https://images.microbadger.com/badges/version/moertel/facebook-token-generator.svg)](https://microbadger.com/images/moertel/facebook-token-generator) &nbsp;  [![](https://images.microbadger.com/badges/image/moertel/facebook-token-generator.svg)](https://microbadger.com/images/moertel/facebook-token-generator)

For server apps which should run in the background without any user interaction, Facebook's policy of expiring access tokens after 60 days is rather inconvenient. This app will generate long-lived tokens by mimicking user interactions in the browser (via PhantomJS) and save the tokens to your local file system.

### Run

If you mount your local volume `/path/to/dir` into the container, the tokens will be stored at:
- `/path/to/dir/shortLivedAuthToken.txt`
- `/path/to/dir/longLivedAuthToken.txt`

```
$ docker run -e FB_CLIENT_ID=123 -e FB_CLIENT_SECRET=xzy \
    -e FB_USER_EMAIL=hi@foo.com -e FB_USER_PASSWORD=secret \
    -e FB_SCOPES=email,user_friends \
    -v /path/to/dir:/token \
    -it moertel/facebook-token-generator
```

### Environment Variables

- `FB_CLIENT_ID`: The client ID of your Facebook application
- `FB_CLIENT_SECRET`: The client secret of your Facebook application
- `FB_SCOPES` _(optional)_: Comma-separated list of scopes to request
- `FB_USER_EMAIL`: Email address of Facebook user account for which to obtain an access token
- `FB_USER_PASSWORD`: Password of Facebook user account

#### Languages other than English

This script assumes that your Facebook language is English. If you use Facebook in another language, you may want to override the button texts:
- `FB_BUTTON_TEXT_GETTOKEN` _(optional)_: Default is "Get Token"
- `FB_BUTTON_TEXT_GETUSERACCESSTOKEN` _(optional)_: Default is "Get User Access Token"
- `FB_BUTTON_TEXT_GETACCESSTOKEN` _(optional)_: Default is "Get Access Token"
