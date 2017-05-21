/**
 * Author: Stefanie Grunwald
 * Version: 1.0
 * Date: 2016-06-14
 */

phantom.cookiesEnabled = true;
phantom.javascriptEnabled = true;

var page = require('webpage').create();
var system = require('system');
var env = system.env;
var fs = require('fs');
var firstTimeConsent = false;
var isDefaultAuthToken = true;
var tokenGenerated = false;
var scopes = (env['FB_SCOPES'] === undefined) ? [] : env['FB_SCOPES'].split(',');

var cookieJar = 'cookies.txt';

page.settings.userAgent = 'Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)';
page.settings.javascriptEnabled = true;
page.settings.loadImages = false;

page.onConsoleMessage = function(msg) {
    system.stderr.writeLine('[FACEBOOK LOGIN] ' + msg);
};

/**
 * Log into Facebook and save the cookies
 */
page.open('https://m.facebook.com/', function(status) {
    console.log('[FACEBOOK LOGIN] START: Logging into Facebook...');

    if (page.url == 'https://m.facebook.com/'){
        fs.write(cookieJar, JSON.stringify(phantom.cookies), "w");
    }

    if(fs.isFile(cookieJar)){
        Array.prototype.forEach.call(JSON.parse(fs.read(cookieJar)), function(x) {
            phantom.addCookie(x);
        });
    }

    page.onCallback = function(p) {
        if(p.exit) {
            console.log('[FACEBOOK LOGIN] ERROR. Exiting...');
            phantom.exit(1);
        }
    }

    page.evaluate(function(email, password) {
        console.log('  |- Fill out form');
        if(!email) { console.log('    |- No Facebook user email given. (Is FB_USER_EMAIL set?)'); }
        if(!password) { console.log('    |- No Facebook user password given. (Is FB_USER_PASSWORD set?)'); }
        if(!email || !password) { window.callPhantom({ exit: true }); }

        var form = document.getElementById("login_form");
        if(!form) {
            console.log('    |- No login form found on ' + page.url);
            window.callPhantom({ exit: true });
        } else {
            form.elements["email"].value = email;
            form.elements["pass"].value = password;
            console.log('  |- Submit form');
            form.submit();
            console.log('DONE.');
        }
    }, env['FB_USER_EMAIL'], env['FB_USER_PASSWORD']);

    window.setTimeout(function() {
        page.close();
        generateToken();
    }, 5000); // wait a bit for the site to be fully loaded before trying to generate the token
});


function generateToken() {
    var graphExplorerPage = require('webpage').create();

    graphExplorerPage.settings.userAgent = 'Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)';
    graphExplorerPage.settings.javascriptEnabled = true;
    graphExplorerPage.settings.loadImages = false;

    graphExplorerPage.onConsoleMessage = function(msg) {
        if(msg.lastIndexOf('Facebook Pixel Warning', 0) === 0) {
            // Silently ignore this warning
        } else {
            system.stderr.writeLine('[GENERATE TOKEN] ' + msg);
        }
    };

    graphExplorerPage.onCallback = function(p) {
        if (p.exit) {
            console.log('[ERROR HANDLER] START: Generating screenshot snapshotting the page at time of error...')
            graphExplorerPage.render('/token/generateTokenError.png');
            console.log('[ERROR HANDLER] DONE: Screenshot \'/token/generateTokenError.png\' saved.');
            console.log('[ERROR HANDLER] Exiting...')
            phantom.exit(1);
        }
    };

    graphExplorerPage.onError = function(message, trace) {
        if(message == "TypeError: undefined is not an object (evaluating 'x.length')") {
            // Silently ignore this error error
            return true;
        } else {
            console.log('[ERROR HANDLER] ' + message);
            console.log('[ERROR HANDLER] Exiting...')
            phantom.exit(1);
        }
    };

    /**
     * As the Graph Explorer pop-up cannot load its dependencies, we extract the access token
     * from the pop-up URL the moment it's requested. I found no better way. :)
     */
    graphExplorerPage.onResourceRequested = function(popupPage) {
        // Check that the call is for the correct resource (the access token pop-up)
        if (popupPage.url && popupPage.url.match('access_token=') && !popupPage.url.match('suppress_http_code=1')) {
            /**
             * In case this is the first time the user authorises the app, the first popup contains the
             * short-lived access token. Otherwise, there are two calls: the first contains a default
             * token which does not grant any permissions at all, and only the second contains the
             * actual short-lived access token we're after.
             */
            if (isDefaultAuthToken && !firstTimeConsent) {
                isDefaultAuthToken = false;
            } else {
                console.log('[GENERATE TOKEN]           |- Located access token popup window');
                var shortLivedAuthToken = popupPage.url.match(/access_token=([^&]+)/)[1];
                fs.write('/token/shortLivedAuthToken.txt', shortLivedAuthToken, 'w');
                console.log('[GENERATE TOKEN]        |- DONE: (Saved short-lived token to file \'/token/shortLivedAuthToken.txt\')');
                tokenGenerated = true;
            }
        }
    }

    /**
     * Opening https://developers.facebook.com/tools/explorer/{FB_CLIENT_ID} opens the Graph Explorer
     * with the app pre-selected. You should not have to choose individual permissions all
     * over again but they should (have) be(en) remembered for the app.
     */
    graphExplorerPage.open('https://developers.facebook.com/tools/explorer/'+env['FB_CLIENT_ID'], function(status) {
        graphExplorerPage.evaluate(function(scopes) {
            /**
             * Mimic clicks on "Get Token" --> "Get User Access Token" --> "Get Access Token"
             * and save the resulting token to the local file system.
             */
            var graphExplorerMainMenuText = 'Get Token';
            var graphExplorerSubMenuText = 'Get User Access Token';
            var graphExplorerSubMenuPopupSubmitButtonText = 'Get Access Token';

            console.log('START: Opening submenu...');
            var linksHTMLColl = document.getElementsByTagName('a');
            var links = []; for(var i = 0; i < linksHTMLColl.length; i++) { links.push(linksHTMLColl[i]); } // Convert HTMLCollection to Array
            var getTokenMenuItem = links.find(function(e) {
                if (e.firstElementChild && e.firstElementChild.innerText) {
                    return e.firstElementChild.innerText.match(graphExplorerMainMenuText);
                } else {
                    return e.innerText.match(graphExplorerMainMenuText);
                }
            });

            if(getTokenMenuItem) {
                // Click 'Get Token'
                console.log('  |- Found \'' + graphExplorerMainMenuText + '\' button.');
                getTokenMenuItem.click();
                console.log('  |- Clicked \'' + graphExplorerMainMenuText + '\' button.');

                // Wait some time for the sub-menu to open
                window.setTimeout(function() {
                    console.log('  |- START: Opening auth dialog...');
                    var subMenuLinksHTMLColl = document.getElementsByTagName('a');
                    var subMenuLinks = []; for(var i = 0; i < subMenuLinksHTMLColl.length; i++) { subMenuLinks.push(subMenuLinksHTMLColl[i]); } // Convert HTMLCollection to Array
                    var getUserAccessTokenMenuItem = subMenuLinks.find(function(e) {
                        if (e.firstElementChild && e.firstElementChild.innerText) {
                            return e.firstElementChild.innerText.match(graphExplorerSubMenuText);
                        } else {
                            return e.innerText.match(graphExplorerSubMenuText);
                        }
                    });

                    if(getUserAccessTokenMenuItem) {
                        // Click 'Get User Access Token'
                        console.log('       |- Found \'' + graphExplorerSubMenuText + '\' button.');
                        getUserAccessTokenMenuItem.click();
                        console.log('       |- Clicked \'' + graphExplorerSubMenuText + '\' button.');

                        // Wait some time for the auth dialog to open
                        window.setTimeout(function() {
                            console.log('       |- START: Generating token...');
                            var buttonsHTMLColl = document.getElementsByTagName('button');
                            var buttons = []; for(var i = 0; i < buttonsHTMLColl.length; i++) { buttons.push(buttonsHTMLColl[i]); } // Convert HTMLCollection to Array
                            var getAccessTokenButton = buttons.find(function(e) {
                                return e.innerText.match(graphExplorerSubMenuPopupSubmitButtonText);
                            });

                            if(getAccessTokenButton) {
                                // Find list of available scopes (each is a checkbox)
                                var inputLabelsHTMLColl = document.getElementsByClassName('uiInputLabelCheckbox');
                                var inputLabels = []; for(var i = 0; i < inputLabelsHTMLColl.length; i++) { inputLabels.push(inputLabelsHTMLColl[i]); } // Convert HTMLCollection to Array

                                // Log all pre-selected scopes
                                for(var i=0; i< inputLabels.length; i++) {
                                    if (inputLabels[i].disabled == true && inputLabels[i].name != "auth_rerequest") {
                                        console.log('          |- Scope \'' + inputLabels[i].name + '\' is already selected.');
                                    }
                                }

                                // Unless pre-selected, request additional scopes
                                for(var i=0; i < scopes.length; i++) {
                                    var scopeLabel = inputLabels.find(function(e) { return e.name == scopes[i]; });
                                    if (scopeLabel) {
                                        if (scopeLabel.disabled == false) {
                                            scopeLabel.click();
                                            console.log('          |- Requested scope \'' + scopes[i] + '\'.');
                                        }
                                    } else {
                                        console.log('          |- WARNING: Could not find scope \'' + scopes[i] + '\'.');
                                    }
                                }
                                // Click 'Get Access Token'
                                console.log('          |- Found \'' + graphExplorerSubMenuPopupSubmitButtonText + '\' button.');
                                getAccessTokenButton.click();
                                console.log('          |- Clicked \'' + graphExplorerSubMenuPopupSubmitButtonText + '\' button.');

                                /**
                                 * First time the app is authorised:
                                 * A popup window "Continue as {username}" opens and a button needs to be clicked. Afterwards,
                                 * the behaviour is the same as for subsequent authorisations.
                                 *
                                 * Subsequent authorisations:
                                 * At this point, a pop-up window should have been opened with with a short-lived auth token.
                                 * Due to PhantomJS limitations, the opened window generates an error upon retrieving its
                                 * JS dependencies. We'll ignore this and catch the URL anyway using the onResourceRequested
                                 * handler further above. The handler parses the token from the URL and saves it to a file.
                                 *
                                 * There's nothing else to do here.
                                 */
                            } else {
                                console.log('ERROR: Something went wrong. Was not able to find the \'' + graphExplorerSubMenuPopupSubmitButtonText + '\' button.');
                                window.callPhantom({ exit: true });
                            }
                        }, 5000); // wait for auth dialog
                    } else {
                        console.log('ERROR: Something went wrong. Was not able to find the \'' + graphExplorerSubMenuText + '\' button.');
                        window.callPhantom({ exit: true });
                    }
                }, 5000); // wait for sub-menu
            } else {
                console.log('ERROR: Something went wrong. Was not able to find the \'' + graphExplorerMainMenuText + '\' button.');
                window.callPhantom({ exit: true });
            }
        }, scopes);

        window.setTimeout(function() {
            // Check whether a popup window has been opened
            if (graphExplorerPage.pages.length == 1) {
                // Check whether the opened window matches the confirmation dialog (appears on first load only)
                if (graphExplorerPage.pages[0].url.match('display=popup') && !graphExplorerPage.pages[0].url.match('access_token=')) {
                    // Let us see the output
                    graphExplorerPage.pages[0].onConsoleMessage = function(msg) {
                        system.stderr.writeLine(msg);
                    };
                    // Locate and click the confirmation button
                    firstTimeConsent = graphExplorerPage.pages[0].evaluate(function(firstTimeConsent) {
                        var buttonsHTMLColl = document.getElementsByTagName("button");
                        var buttons = []; for(var i = 0; i < buttonsHTMLColl.length; i++) { buttons.push(buttonsHTMLColl[i]); } // Convert HTMLCollection to Array
                        var confirmationButton = buttons.find(function(e) { return e.name == "__CONFIRM__" });

                        if(confirmationButton) {
                            console.log('[GENERATE TOKEN]           |- Found \'Continue as {username}\' button.')
                            // Click the confirmation button
                            window.setTimeout(function() {
                                console.log('[GENERATE TOKEN]           |- Clicked \'Continue as {username}\' button.')
                                confirmationButton.click();
                            }, 1000);
                            // set firstTimeConsent to true
                            return true;
                        } else {
                            console.log('ERROR: Something went wrong. Was not able to find the \'' + 'Continue as {username}' + '\' button.');
                            window.callPhantom({ exit: true });
                            return false;
                        }
                    }, firstTimeConsent);
                }
            }
        }, 20000);

        window.setTimeout(function() {
            if(tokenGenerated == true) {
                console.log('[GENERATE TOKEN]   |- DONE.');
                console.log('[GENERATE TOKEN] DONE.');
                phantom.exit(0);
            } else {
                console.log('ERROR: Something went wrong. Was not able to obtain or save the short-lived token!');
                phantom.exit(1);
            }
        }, 40000); // wait 40 seconds in total for all steps to be performed, especially the onResourceRequested handler saving the token
    });
}
