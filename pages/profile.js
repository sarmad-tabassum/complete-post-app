import { supabaseClient } from "./supabaseConfig.js";

const editForm = document.getElementById("editProfileForm");
const nameInp = document.getElementById("editNameInp");
const emailInp = document.getElementById("userEmail");
const phoneInp = document.getElementById("editPhoneInp");
const avatarImg = document.getElementById("userAvatar");
const avatarInput = document.getElementById("avatarInput");
const loader = document.getElementById("loader");

//  Default PFP
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

//  LOADER FUNC
function showLoader() {
  if (loader) loader.style.display = "flex";
}
function hideLoader() {
  if (loader) loader.style.display = "none";
}

//  SHOW USER INFO FUNC
async function showUserInfo() {
  showLoader();
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    window.location.href = "../index.html";
    return;
  }

  // console.log(data.session);
  const user = data.session.user;

  if (user.user_metadata) {
    nameInp.value = user.user_metadata.full_name || "";
    phoneInp.value = user.user_metadata.phone_number || "";
    avatarImg.src = user.user_metadata.avatar_url || defaultAvatar;
  }

  emailInp.value = user.email || "";

  hideLoader();
}

//  FORM SUBMIT FUNC
if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = nameInp.value.trim();
    const phone = phoneInp.value.trim();
    const imageFile = avatarInput.files[0];
    
    showLoader();
    
    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;
    
    let finalAvatarUrl = defaultAvatar;
    if (user.user_metadata && user.user_metadata.avatar_url) {
      finalAvatarUrl = user.user_metadata.avatar_url;
    }
    
    if (imageFile) {
      const fileName = `${user.id}-${Date.now()}.png`;
      
      const { error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(fileName, imageFile);
      
      if (uploadError) {
        hideLoader();
        return Swal.fire("Error", "Image upload failed", "error");
      }
      
      const { data: publicUrlData } = supabaseClient.storage
      .from("avatars")
      .getPublicUrl(fileName);
      
      finalAvatarUrl = publicUrlData.publicUrl;
    }

    const { error: authError } = await supabaseClient.auth.updateUser({
      data: {
        full_name: name,
        phone_number: phone,
        avatar_url: finalAvatarUrl,
      },
    });

    if (authError) {
      hideLoader();
      return Swal.fire("Error", authError.message, "error");
    }

    const { error: postsError } = await supabaseClient
      .from("posts")
      .update({
        user_name: name,
        user_avatar: finalAvatarUrl,
      })
      .eq("user_id", user.id);

    hideLoader();
    Swal.fire("Success", "Profile Updated!", "success");
    window.location.href = "dashboard.html";
  });
}

showUserInfo();

//  PFP VIEWER
const avatar = document.querySelector(".avatar-wrapper");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.getElementById("closeModal");

if (avatar) {
  avatar.addEventListener("click", () => {
    modalImage.src = document.getElementById("userAvatar").src;
    imageModal.classList.add("active");
  });
}

if (closeModal) {
  closeModal.addEventListener("click", () => {
    imageModal.classList.remove("active");
  });
}

if (imageModal) {
  imageModal.addEventListener("click", (e) => {
    if (e.target === imageModal) {
      imageModal.classList.remove("active");
    }
  });
}
