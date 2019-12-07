import { supabaseClient } from "./pages/supabaseConfig.js";

let loginBtn = document.getElementById("signin");
let signupBtn = document.getElementById("signup");

//  Check USER FUNC
async function getCurrentUser() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    return console.log(error.message);
  }

  if (data.session) {
    return window.location.href = "./pages/dashboard.html";
  }
}

getCurrentUser();

 // LOGIN FUNC
if (loginBtn) {
  loginBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("pass").value.trim();

    if (!email || !password) {
      Swal.fire("Error", "Please fill all fields", "warning");
      return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Swal.fire("Login Failed", error.message, "error");
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Login Successful",
      timer: 1200,
      showConfirmButton: false,
    });

    window.location.href = "./pages/dashboard.html";
  });
}

// SIGNUP FUNC
if (signupBtn) {
  signupBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    let username = document.getElementById("username-inp").value.trim();
    let phone = document.getElementById("ph-inp").value.trim();
    let email = document.querySelector(".signup-email").value.trim();
    let password = document.querySelector(".signup-pass").value.trim();

    if (!username || !phone || !email || !password) {
      Swal.fire("Error", "Please fill all fields", "warning");
      return;
    }

    if (phone.length !== 11 || isNaN(phone)) {
      Swal.fire("Invalid Phone", "Phone number must be 11 digits", "error");
      return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: username,
          phone_number: phone,
        },
      },
    });

    if (error) {
      Swal.fire("Signup Failed", error.message, "error");
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Account Created",
      timer: 1200,
      showConfirmButton: false,
    });

    window.location.href = "./pages/dashboard.html";
  });
}

// SOCIAl LOGIN FUNC
window.loginWithSocial = async function (provider) {
  let result = await supabaseClient.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `https://sarmad-tabassum.github.io/complete-post-app/pages/dashboard.html`,
    },
  });

  if (result.error) {
    Swal.fire("Error", result.error.message, "error");
  }
};

// FORGOT PASSWORD FUNC
if (window.location.pathname.includes("forgot.html")) {
  let resetBtn = document.getElementById("send-reset-btn");

  resetBtn.addEventListener("click", async function () {
    let email = document.getElementById("forgot-email").value;

    if (!email) {
      Swal.fire("Error", "Enter your email", "warning");
      return;
    }

    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `https://sarmad-tabassum.github.io/complete-post-app/pages/update-password.html`,
      },
    );

    if (error) {
      Swal.fire("Error", error.message, "error");
      return;
    }

    Swal.fire("Success", "Reset link sent to email", "success");
  });
}

// UPDATE PASSWORD FUNC
if (window.location.pathname.includes("update-password.html")) {
  let updateBtn = document.getElementById("update-pass-btn");

  updateBtn.addEventListener("click", async () => {
    let password = document.getElementById("new-pass").value;

    if (!password || password.length < 6) {
      Swal.fire("Error", "Password must be at least 6 characters", "warning");
      return;
    }

    const { data, error } = await supabaseClient.auth.updateUser({
      password: password,
    });

    if (error) {
      Swal.fire("Error", error.message, "error");
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Password Updated",
      timer: 1500,
      showConfirmButton: false,
    });
     window.location.href = `./index.html`
  });
}
