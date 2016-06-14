# Facebook Token Generator

For server apps which should run in the background without any user interaction, Facebook's policy of expiring access tokens after 60 days is rather inconvenient. This app will generate long-lived tokens by mimicking user interactions in the browser (via PhantomJS) and save them to your local file system.

### Environment Variables

- `FB_CLIENT_ID`: The client ID of your Facebook application
- `FB_CLIENT_SECRET`: The client secret of your Facebook application
- `FB_USER_EMAIL`: Email address of the Facebook user account for which you want to obtain an access token
- `FB_USER_PASSWORD`: Password of the Facebook user account

### Run

If you mount your local volume `/path/to/dir` into the container, the tokens will be stored at `/path/to/dir/shortLivesAccessToken.txt` and `/path/to/dir/longLivedAccessToken.txt`.

```
$ docker run -e FB_CLIENT_ID=123 -e FB_CLIENT_SECRET=xzy -e FB_USER_EMAIL=hi@foo.com -e FB_USER_PASSWORD=secret \
    -v /path/to/dir:/token \
    -it moertel/facebook-token-generator
```
