import { getApiBaseUrl, setApiBaseUrl } from "../ui/api/client.js";

const apiBaseUrl = document.getElementById("apiBaseUrl");
const save = document.getElementById("save");
const status = document.getElementById("status");

const init = async () => {
  apiBaseUrl.value = await getApiBaseUrl();
};

save.addEventListener("click", async () => {
  const value = apiBaseUrl.value.trim();
  if (!value) return;
  await setApiBaseUrl(value);
  status.textContent = "Saved";
  setTimeout(() => {
    status.textContent = "";
  }, 1200);
});

init();
