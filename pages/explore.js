import { supabaseClient } from "./supabaseConfig.js";

const logoutBtn = document.getElementById("logout");
const exploreContainer = document.getElementById("exploreGlobalContainer");

//  Default PFP
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

//  GET CURRENT USER FUNC
async function getCurrentUser() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    return console.log("Auth Error:", error.message);
  }

  if (data.session) {
    return data.session.user;
  } else {
    return window.location.href = "../index.html";
    }
}

// LOADER FUNC
const loader = document.getElementById("loader");
function showLoader() {
  if (loader) loader.style.display = "flex";
}
function hideLoader() {
  if (loader) loader.style.display = "none";
}

//EDIT PROFILE BTN FUNC
let editProfileBtn = document.getElementById("edit-profile-btn");
if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
}

//  SHOW USER INFO FUNC
async function showUserInfo() {
  showLoader();
  const user = await getCurrentUser();

  if (!user) return;

  let name = user.user_metadata.full_name || "Postify User";
  let phone = user.user_metadata.phone_number || "No Phone Number";
  let avatar = user.user_metadata.avatar_url || defaultAvatar;

  if (document.getElementById("userAvatar"))
    document.getElementById("userAvatar").src = avatar;
  if (document.getElementById("userName-hed"))
    document.getElementById("userName-hed").innerText = name;
  if (document.getElementById("userEmail"))
    document.getElementById("userEmail").innerText = user.email;

  await loadPosts();
  hideLoader();
}

//  LOGOUT BTN FUNC
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Do you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Logout",
    });

    if (!result.isConfirmed) return;

    const { error } = await supabaseClient.auth.signOut();
    if (error) return Swal.fire({ icon: "error", text: error.message });

    window.location.href = "../index.html";
  });
}

//  LOAD POSTS FUNC
async function loadPosts() {
  if (!exploreContainer) return;

  const { data: posts, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Database Fetch Error:", error.message);
    return;
  }

  exploreContainer.innerHTML = "";

  if (!posts || posts.length === 0) {
    exploreContainer.innerHTML = `<div class="create-post-card"><h3>No Posts Found</h3></div>`;
    return;
  }

  posts.forEach((post) => {
    const postUserAvatar =
      post.user_avatar ||
      "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    const postMediaHTML = post.image_url
      ? `<div class="feed-media-wrap" style="margin-top: 14px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background: #fafafa;">
           <img src="${post.image_url}" 
                alt="Post Attachment" 
                style="width: 100%; max-height: 450px; object-fit: cover; display: block;"
                onerror="this.style.display='none';">
         </div>`
      : "";

    exploreContainer.innerHTML += `
    <div class="feed-card" style="margin-bottom: 24px;">
        <div class="feed-header">
            <div class="feed-user">
                <div class="avatar">
                    <img src="${postUserAvatar}" 
                         onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png';" 
                         alt="User Avatar" 
                         style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                </div>
                <div class="user-info">
                    <h4>${post.user_name || "Anonymous User"}</h4>
                    <span>
                        <i class="far fa-clock"></i> 
                        ${new Date(post.created_at).toLocaleDateString()}
                    </span>
                </div>
            </div>
            <i class="fas fa-ellipsis"></i>
        </div>

        <div class="feed-body">
            <h3 style="margin-bottom: 8px;">${post.title}</h3>
            <p style="white-space: pre-wrap;">${post.content}</p>
            
            ${postMediaHTML}
        </div>

        <div class="feed-stats" style="margin-top: 15px;">
            <span><i class="fas fa-heart"></i> ${post.likes_count || 0} Likes</span>
            <span><i class="far fa-comment-alt"></i> ${post.comments_count || 0} Comments</span>
        </div>

        <div class="feed-actions">
            <button class="like-btn"><i class="far fa-heart"></i> Like</button>
            <button class="comment-btn"><i class="far fa-comment"></i> Comment</button>
            <button class="share-btn"><i class="far fa-paper-plane"></i> Share</button>
        </div>

        <div class="post-footer">
            <span class="post-date">
               ${new Date(post.created_at).toLocaleTimeString()}
            </span> 
        </div>
    </div>
    `;
  });
}

showUserInfo();
