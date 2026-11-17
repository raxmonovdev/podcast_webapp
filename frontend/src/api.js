const API = "/api";

function headers() {
  const result = { "Content-Type": "application/json" };
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    result["X-Telegram-Init-Data"] = initData;
  } else {
    // Telegram tashqarisida backend buni faqat ALLOW_DEV_AUTH=true bo'lsa qabul qiladi.
    result["X-Dev-Auth"] = "1";
  }
  return result;
}

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(API + path, {
      ...options,
      headers: { ...headers(), ...(options.headers || {}) },
    });
  } catch (err) {
    const error = new Error("Serverga ulanib bo'lmadi");
    error.status = 0;
    throw error;
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = typeof body.detail === "string" ? body.detail : "";
    } catch (err) {
      detail = "";
    }
    const error = new Error(detail || "So'rov bajarilmadi");
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}
