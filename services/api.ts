const API_BASE = "https://api.networkbaba.co";

// 🔐 LOGIN API
export async function loginUser(data: {
  email: string;
  password: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: data.email,
        password: data.password,
      }),
    });

    return await res.json();
  } catch (err) {
    return {
      status: false,
      message: "Network error",
    };
  }
}

// 💼 GET JOBS API
export async function getJobs() {
  try {
    const res = await fetch(`${API_BASE}/jobs`);

    return await res.json();
  } catch (err) {
    return {
      status: false,
      message: "Network error",
      data: [],
    };
  }
}