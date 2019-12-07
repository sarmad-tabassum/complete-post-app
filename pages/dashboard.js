import { supabaseClient } from "./supabaseConfig.js";

const logoutBtn = document.getElementById("logout");
const publishPostBtn = document.getElementById("publish-post-btn");
const postsContainer = document.getElementById("postsContainer");
const emptyFeed = document.getElementById("emptyFeedState");

let editingPostId = null;

// Default PFP
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// LOADER FUNC
const loader = document.getElementById("loader");
function showLoader() {
  if (loader) loader.style.display = "flex";
}
function hideLoader() {
  if (loader) loader.style.display = "none";
}

// GET USER FUNC
async function getCurrentUser() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    return console.log("Auth Error:", error.message);
  }

  if (!data.session) {
    return window.location.href = "../index.html";
  }
}

// EDIT PROFILE BTN FUNC
let editProfileBtn = document.getElementById("edit-profile-btn");
if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
}

// SHOW USER INFO FUNC
async function showUserInfo() {
  showLoader();
  const user = await getCurrentUser();

  if (!user) return;

  let name = user.user_metadata.full_name || "Postify User";
  let phone = user.user_metadata.phone_number || "No Phone Number";
  let avatar = user.user_metadata.avatar_url || defaultAvatar;

  if (document.getElementById("userName-hed"))
    document.getElementById("userName-hed").innerText = name;
  if (document.getElementById("userName"))
    document.getElementById("userName").innerText = name;
  if (document.getElementById("userEmail"))
    document.getElementById("userEmail").innerText = user.email;
  if (document.getElementById("userPhone"))
    document.getElementById("userPhone").innerText = phone;
  if (document.getElementById("userAvatar"))
    document.getElementById("userAvatar").src = avatar;
  if (document.getElementById("creatorAvatarSync"))
    document.getElementById("creatorAvatarSync").src = avatar;

  if (document.getElementById("statsAvatarSync"))
    document.getElementById("statsAvatarSync").src = avatar;
  if (document.getElementById("statsNameSync"))
    document.getElementById("statsNameSync").innerText = name;
  if (document.getElementById("statsEmailSync"))
    document.getElementById("statsEmailSync").innerText = user.email;

  await loadPosts();
  hideLoader();
}

// PUBLISHING POST FUNC
if (publishPostBtn) {
  publishPostBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const title = document.getElementById("postTitle").value.trim();
    const content = document.getElementById("postContent").value.trim();
    const imageInput = document.getElementById("postImageInp"); // HTML Input target

    if (!title || !content) {
      return Swal.fire({ icon: "warning", text: "Fill all text fields" });
    }

    publishPostBtn.disabled = true;
    publishPostBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const user = await getCurrentUser();
    let imageUrl = null;

    if (imageInput && imageInput.files.length > 0) {
      const file = imageInput.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("post-images")
        .upload(filePath, file);

      if (uploadError) {
        publishPostBtn.disabled = false;
        publishPostBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish';
        return Swal.fire({
          icon: "error",
          title: "Image Upload Failed",
          text: uploadError.message,
        });
      }

      const { data: publicUrlData } = supabaseClient.storage
        .from("post-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    if (editingPostId) {
      const updateData = { title, content };
      if (imageUrl) updateData.image_url = imageUrl;

      const { error } = await supabaseClient
        .from("posts")
        .update(updateData)
        .eq("id", editingPostId);

      if (error) {
        publishPostBtn.disabled = false;
        publishPostBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish';
        return Swal.fire({ icon: "error", text: error.message });
      }

      await Swal.fire({
        icon: "success",
        title: "Post Updated!",
        timer: 1500,
        showConfirmButton: false,
      });
      editingPostId = null;
    } else {
      let name = user.user_metadata.full_name || "Postify User";
      let avatar = user.user_metadata.avatar_url || defaultAvatar;

      const { error } = await supabaseClient.from("posts").insert([
        {
          title: title,
          content: content,
          user_id: user.id,
          user_name: name,
          user_avatar: avatar,
          image_url: imageUrl, 
        },
      ]);

      if (error) {
        publishPostBtn.disabled = false;
        publishPostBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish';
        return Swal.fire({ icon: "error", text: error.message });
      }

      await Swal.fire({
        icon: "success",
        title: "Post Published!",
        timer: 1500,
        showConfirmButton: false,
      });
    }

    document.getElementById("postTitle").value = "";
    document.getElementById("postContent").value = "";
    if (imageInput) imageInput.value = ""; 

    loadPosts();

    publishPostBtn.disabled = false;
    publishPostBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish';
  });
}

// LOAD POSTS FUNC
async function loadPosts() {
  if (!postsContainer) return;

  const user = await getCurrentUser();

  const { data: posts, error } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    return;
  }

  const totalPostsCountEl = document.getElementById("totalPostsCount");
  if (totalPostsCountEl) {
    totalPostsCountEl.innerText = posts.length || 0;
  }

  postsContainer.innerHTML = "";

  if (!posts || posts.length === 0) {
    if (emptyFeed) emptyFeed.style.display = "flex";
    return;
  }

  if (emptyFeed) emptyFeed.style.display = "none";

  posts.forEach((post) => {
    const postImageHTML = post.image_url
      ? `<div class="post-media-wrap" style="margin-top:12px; border-radius:8px; overflow:hidden;">
           <img src="${post.image_url}" alt="Post Image" style="width:100%; max-height:400px; object-fit:cover;">
         </div>`
      : "";

    postsContainer.innerHTML += `
    <div class="post-card" id="card-${post.id}">
      <div class="post-header">
        <div>
          <span class="post-user">${post.user_name || "Postify User"}</span>
          <h3 class="post-title">${post.title}</h3>
        </div>
        <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
      </div>
      <p class="post-content">${post.content}</p>
      ${postImageHTML} 
      <div class="post-actions" style="margin-top:15px;">
        <button class="edit-btn" onclick="editingPost('${post.id}')">Edit</button>
        <button class="delete-btn" onclick="deletePost('${post.id}')">Delete</button>
      </div>
    </div>`;
  });
}

// EDITING POST FUNC
window.editingPost = async (id) => {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return console.log(error.message);

  document.getElementById("postTitle").value = data.title;
  document.getElementById("postContent").value = data.content;

  editingPostId = data.id;
  publishPostBtn.innerHTML = '<i class="fas fa-edit"></i> Update Post';
};

// DELETE POST FUNC
window.deletePost = async (id) => {
  const result = await Swal.fire({
    title: "Delete Post?",
    icon: "warning",
    showCancelButton: true,
  });

  if (!result.isConfirmed) return;

  const { error } = await supabaseClient.from("posts").delete().eq("id", id);
  if (error) return Swal.fire({ icon: "error", text: error.message });

  loadPosts();
};

// LOGOUT BTN FUNC
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

showUserInfo();



