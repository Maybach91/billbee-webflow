import Pristine from '../vendor/pristine';

const SignUp = () => {
  // -----------------------
  // Variables Configuration
  // -----------------------
  const formConfig = {
    // Form Inputs
    formId: "signup-form",
    passwordFieldId: "password",
    emailFieldId: "email",
    // API
    proxy: (window.location.hostname.indexOf("billbee.io") >= 0) ? "" : "https://api.allorigins.win/raw?url=",
    createAccountApiUrl:
      "https://app.billbee.io/api/v1/internalapi/createaccount",
    checkUsernameApiUrl:
      "https://app.billbee.io/api/v1/internalapi/checkusername?username=",
    loginUrl: "https://app.billbee.io/login",
    debug: (window.location.hostname.indexOf("billbee.io") >= 0) ? false : true
  };
  const {
    formId,
    passwordFieldId,
    emailFieldId,
    proxy,
    loginUrl,
    debug
  } = formConfig;
  let { createAccountApiUrl, checkUsernameApiUrl } = formConfig;

  // ------------------
  // HTML Node Elements
  // ------------------
  const form = document.getElementById(formId);

  // Get the according password field as node
  const passwordField = document.getElementById(passwordFieldId);

  // Email Field as node
  const emailField = document.getElementById(emailFieldId);


  // create the pristine instance
  const pristine = new Pristine(form);
  // SetUp API URLS
  // If we need a proxy (to avoid CORS conflicts) we need to prefix the url with it
  if (proxy.length) {
    createAccountApiUrl = `${proxy}${createAccountApiUrl}`;
    checkUsernameApiUrl = `${proxy}${checkUsernameApiUrl}`;
  }

  // -------------------
  // Password validation
  // -------------------
  // 8-20 Characters
  // min one letter
  // min one number
  const regEx = {
    charMin: new RegExp("^(?=.{8,})"),
    charMax: new RegExp("^(?=.{8,20}$)"),
    letter: new RegExp("^(?=.*[a-zA-Z])"),
    num: new RegExp("^(?=.*[0-9])")
  };
  const pwdText = {
    charMin:
      "Das Passwort muss <strong>mindestens 8 Zeichen</strong> lang sein.",
    letter:
      "Das Passwort muss aus mindestens <strong>einen Buchstaben</strong> bestehen.",
    charMax:
      "Das Passwort darf <strong>nicht über 20 Zeichen</strong> lang sein.",
    num:
      "Das Passwort muss aus mindestens <strong>einer Zahl</strong> bestehen."
  };

  // go through every rule and show the error text (source: https://codepen.io/sha256/pen/KEjabq?editors=1010)
  Object.keys(regEx).forEach((key, index) => {
    pristine.addValidator(
      passwordField,
      function (value) {
        if (regEx[key].test(value)) {
          return true;
        }
        return false;
      },
      pwdText[key],
      index,
      false
    );
  });

  // Request Function
  function makeRequest (opts) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open(opts.method, opts.url);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      if (opts.headers) {
        Object.keys(opts.headers).forEach(function (key) {
          xhr.setRequestHeader(key, opts.headers[key]);
        });
      }
      let params = opts.params;

      // We'll need to stringify if we've been given an object
      // If we have a string, this is skipped.

      if (params && typeof params === "object") {
        params = Object.keys(params).map(function (key) {
          return (
            encodeURIComponent(key) + "=" + encodeURIComponent(params[key])
          );
        }).join("&");
      }
      xhr.send(params);
    });
  }

  // ------------------
  // E-Mail API Request
  // ------------------
  // Checks if the EMAIL is already registered on the API endpoint

  // Init a timeout variable to be used for email check
  let timeout = null;

  const checkEmailExistence = (email) => {
    const fieldParent = emailField.parentNode;
    return new Promise(function (resolve, reject) {
      // Clear the timeout if it has already been set.
      // This will prevent the previous task from executing
      // if it has been less than <MILLISECONDS>
      clearTimeout(timeout);

      // Make a new timeout set to go off in 1000ms (1 second)
      timeout = setTimeout(function () {

        makeRequest({
          method: "GET",
          url: checkUsernameApiUrl + encodeURIComponent(email)
        }).then(response => {
          if (response.length) {
            debug &&
            console.info(
              `%c ${email} ist frei`,
              "color: #009d55; background-color:#c4eac1"
            );
            fieldParent.classList.remove('is-loading');
            fieldParent.classList.add('is-successful');

            setTimeout(function () {
              fieldParent.classList.remove('is-successful');
            }, 2000);

            resolve(true);
          } else {
            debug &&
            console.error(`%c ${email} ist nicht frei`, "color: #d60202");

            pristine.addError(
              emailField,
              `E-Mail bereits registriert, <a target="_blank" href="${loginUrl}">Login</a>?`
            );

            fieldParent.classList.remove('is-loading');
            reject(false);

          }
        }).catch((err) => {

          if (err.status === 409) {
            debug && console.error(`%c ${email} ist nicht frei`, "color: #d60202");
            pristine.addError(
              emailField,
              `E-Mail bereits registriert, <a target="_blank" href="${loginUrl}">Login</a>?`
            );

            fieldParent.classList.remove('is-loading');
            reject(false);
          } else {
            if (debug) {
              console.group("Server Error");
              console.info(
                "Server not reachable, blocked because of CORS policy, try setting a proxy?"
              );
              console.error(err);
              console.groupEnd();
            }

            fieldParent.classList.remove('is-loading');
            reject(err);
            throw new Error(
              "Server not reachable, blocked because of CORS policy, try setting a proxy?",
              err
            );
          }
        });
      }, 400);
    });
  }

  // Post Function to create the account
  const sendDataToCreateAccount = (formData) => {
    // Bind the FormData object and the form element
    const FD = formData;

    // We need to set the value of acceptterms to true, if its checked
    FD.get("acceptterms") == "on"
      ? FD.set("acceptterms", true)
      : FD.set("acceptterms", false);

    const FormDataObject = Object.fromEntries(FD);
    const FormDataJson = JSON.stringify(FormDataObject);

    if (debug) {
      console.group("About to sending follwing formData:");
      console.table(FormDataObject);
      console.groupEnd();
    }
    return new Promise(function (resolve, reject) {
      makeRequest({
        method: "POST",
        url: createAccountApiUrl,
        params: FormDataJson,
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        }
      }).then((response) => {
        if (response) {
          const responseJson = JSON.parse(response);
          if (debug) {
            console.group("Success POST Response data:");
            console.log(responseJson);
            console.groupEnd();
            console.log(responseJson.Data.ErrorMessage);
            console.log("Redirect User according to response OnTimeLogiUrl (deactivated in debug mode):");
            console.log(responseJson.Data.OneTimeLoginUrl);
          }
          // Redirect user according to response redirect url
          if (debug !== true) {
            window.location.href = responseJson.Data.OneTimeLoginUrl
          }
          resolve(true)
        } else {
          reject(false)
        }

      }).catch((err) => {
        if (debug) {
          console.log("damn, error");
          console.error(err);
        }
        reject(err);
      });

    });


    // @ToDo: Add Track Signup
  }

  function onSubmit (formData, emailValue) {

    form.parentNode.classList.add('is-loading');
    checkEmailExistence(emailValue).then(async () => {
      debug && console.log("sendData");
      sendDataToCreateAccount(formData).then(() => {
        form.parentNode.classList.remove('is-loading');
        form.parentNode.classList.remove('is-failed');
        form.parentNode.classList.add('is-successful');
      }).catch(e => {
        form.parentNode.classList.remove('is-loading');
        form.parentNode.classList.remove('is-successful');
        form.parentNode.classList.add('is-failed');
        console.error("signup.js:301 errorOnSubmit()", e);
        debug && console.error(e);
         });
    }).catch((e) => {
      form.parentNode.classList.remove('is-loading');
      form.parentNode.classList.remove('is-successful');
      form.parentNode.classList.add('is-failed');
      console.error("signup.js:301 errorOnSubmit()", e);
      debug && console.error(e);
    });
  }


  pristine.addValidator(
    emailField,
    async function (value) {
      let success;
      if (!this.validity.typeMismatch) {
        this.parentNode.classList.add('is-loading');
        try {
          success = await checkEmailExistence(value.toLowerCase())
        } catch {
          success = false;
          return false;
        }
      }
      return success;
    },
    "E-Mail wurde bereits registriert, Login?", // This DOES NOT WORK (https://github.com/sha256/Pristine/issues/51), so we handle errors in the checkEmailExistence function
    1,
    false
  );


  // Validate on Submit (and on input)
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const emailValue = emailField.value.toLowerCase();
    debug && console.log("Form submitted.");

    // Webflow Form Status Elements
    const webflowFormDone = e.target.parentNode.getElementsByClassName('w-form-done')[0];
    const webflowFormFail = e.target.parentNode.getElementsByClassName('w-form-fail')[0];

    // check if the form is valid
    const formValid = pristine.validate(); // returns true or false
    debug && console.log("Form is validated:", formValid);

    if (formValid && !pristine.getErrors(emailField).length) {
      debug && console.info("Form is valid, check username & sending data.");
      onSubmit(formData, emailValue);
      // onSubmit(formData, emailValue).then(r => {
      //   console.log('Successful', r);
      //   form.parentNode.classList.add('is-successful');
      // }).catch(r => {
      //   console.error('error', r);
      //   form.parentNode.classList.add('is-failed');
      // });
    }

    // Check, if the username is already registered against the API, if the email input is valid
    /*if (!pristine.getErrors(emailField).length) {
      checkUsernameExistence(emailField.value);
      debug &&
        console.info(
          "E-Mail input has no errors, check username for existence. (Othter fields can still have errors)"
        );
      // @ToDo: According to return of the function add a new Error to the email field

      // Register the username, when the form is valid
    }*/
  });
}
export default SignUp;
/*
jQuery(document).ready(function () {
  var form = document.getElementById("signup");

  form.onsubmit = function (e) {
    // stop the regular form submission
    e.preventDefault();

    if (jQuery("#btnCreateAccountDo").hasClass("disabled")) {
    } else {
      jQuery("#signup").css("display", "none");
      jQuery("#signingup").css("display", "inline");

      // collect the form data while iterating over the inputs
      var data = {};
      data["email"] = jQuery("#username").val();
      data["password"] = jQuery("#password").val();
      if (jQuery("#acceptterms").is(":checked")) data["acceptterms"] = true;
      else data["acceptterms"] = false;
      if (jQuery("#newsletter").is(":checked")) data["newsletter"] = true;
      else data["newsletter"] = false;

      console.log(JSON.stringify(data));

      signup(data);
    }
  };
});

function signup(data) {
  jQuery.ajax({
    type: "POST",
    url: "https://app.billbee.io/api/v1/internalapi/createaccount",
    data: JSON.stringify(data),
    dataType: "json",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    success: function (response, status, jqXHR) {
      // ga('send', 'event', 'Account', 'signup');
      $FPROM.trackSignup(
        {
          email: data.email,
          uid: response.Data.UserId
        },
        function () {}
      );
      window.location.href = response.Data.OneTimeLoginUrl;
    },
    error: function (jqXHR, status) {
      console.log(jqXHR);
      alert("fail" + status.code);
    }
  });
}
*/
