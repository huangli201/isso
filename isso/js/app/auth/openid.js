define(["app/dom", "app/config", "app/api", "app/jade", "app/i18n"], function($, config, api, jade, i18n) {

    "use strict";

    var isso = null;
    var loggedIn = false;
    var sessionID = null;
    var authorData = null;

    var init = function(isso_ref) {
        if (!config["openid-enabled"]) {
            return;
        }
        isso = isso_ref;
        var method = JSON.parse(localStorage.getItem("login_method"));
        var sid = JSON.parse(localStorage.getItem("openid_session_id"));
        var ad = JSON.parse(localStorage.getItem("author_data"));
        if (method == "openid" && sid) {
            api.openidStatus(sid).then(function (rv) {
                if (rv.loggedin) {
                    loggedIn = true;
                    sessionID = sid;
                    authorData = ad;
                }
                isso.updateAllPostboxes();
            });
        }
        window.addEventListener("message", function(event) {
            var origin = event.origin || event.originalEvent.origin;
            if (origin != api.endpoint)
                return;
            loggedIn = true;
            sessionID = event.data.state;
            authorData = {
                identifier: event.data.identifier,
                name: event.data.name,
                email: event.data.email,
                pictureURL: event.data.picture,
                website: event.data.website,
            };
            localStorage.setItem("login_method", JSON.stringify("openid"));
            localStorage.setItem("openid_session_id", JSON.stringify(sessionID));
            localStorage.setItem("author_data", JSON.stringify(authorData));
            isso.updateAllPostboxes();
        }, false);
    }

    var updatePostbox = function(el) {
        if (!config["openid-enabled"]) {
            return;
        }
        if (loggedIn) {
            $(".auth-not-loggedin", el).hide();
            $(".auth-loggedin-openid", el).showInline();
            $(".auth-openid-name", el).innerHTML = authorData.name;
            if (authorData.pictureURL)
                $(".isso-postbox .avatar", el).setAttribute("src", authorData.pictureURL);
            else
                $(".isso-postbox .avatar", el).hide();
            $(".isso-postbox .avatar", el).show();
        } else {
            $(".auth-loggedin-openid", el).hide();
            $(".login-link-openid", el).showInline();
            $(".login-link-openid > img", el).setAttribute("src", api.endpoint + "/img/openid-icon-32x32.png");
        }
    }

    var initPostbox = function(el) {
        if (!config["openid-enabled"]) {
            return;
        }
        updatePostbox(el);
        $(".logout-link-openid", el).on("click", function() {
            api.openidLogout(sessionID);
            loggedIn = false;
            sessionID = null;
            authorData = null;
            localStorage.removeItem("login_method");
            localStorage.removeItem("openid_session_id");
            localStorage.removeItem("author_data");
            isso.updateAllPostboxes();
        });
        $(".login-link-openid", el).on("click", function() {
            var win = window.open("", "OpenID Connect login",
                                  "width=500, height=500, menubar=no, location=yes, toolbar=no, status=yes");
            win.document.head.innerHTML = "<title>" + i18n.translate("openid-title") + "</title>"
                + "<link rel=\"stylesheet\" type=\"text/css\" href=\"" + api.endpoint + "/css/isso.css\">";
            win.document.body.setAttribute("class", "isso-openid-popup");
            win.document.body.innerHTML = jade.render("openid-identifier", {});
            win.document.getElementById("isso-openid-logo").setAttribute("src", api.endpoint + "/img/openid-icon-32x32.png");
            win.document.getElementById("isso-openid-login-form").setAttribute("action", api.endpoint + "/openid/login");
        });
    }

    var isLoggedIn = function() {
        return loggedIn;
    }

    var getAuthorData = function() {
        return {
            network: "openid",
            id: authorData.identifier,
            idToken: sessionID,
            pictureURL: authorData.pictureURL,
            name: authorData.name,
            email: authorData.email,
            website: authorData.website,
        };
    }

    var prepareComment = function(comment) {
    }

    return {
        init: init,
        initPostbox: initPostbox,
        updatePostbox: updatePostbox,
        isLoggedIn: isLoggedIn,
        getAuthorData: getAuthorData,
        prepareComment: prepareComment
    };

});
