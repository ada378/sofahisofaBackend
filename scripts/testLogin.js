import http from "http";

const API_URL = "http://localhost:5000";

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function testLogin() {
  try {
    console.log("🧪 Testing Login System...\n");
    
    // Test Admin Login
    console.log("1️⃣ Testing Admin Login...");
    const adminRes = await makeRequest("/api/auth/login", {
      email: "admin@sofahisofa.com",
      password: "Admin@SofaHiSofa2026"
    });
    
    if (adminRes.status === 200) {
      console.log("✅ Admin login successful!");
      console.log("   Role:", adminRes.data.role);
    } else {
      console.log("❌ Admin login failed:", adminRes.data.message);
    }
    console.log();
    
    // Test SEO Login
    console.log("2️⃣ Testing SEO Login...");
    const seoRes = await makeRequest("/api/auth/login", {
      email: "seo@sofahisofa.com",
      password: "Seo@SofaHiSofa2026"
    });
    
    if (seoRes.status === 200) {
      console.log("✅ SEO login successful!");
      console.log("   Role:", seoRes.data.role);
    } else {
      console.log("❌ SEO login failed:", seoRes.data.message);
    }
    console.log();
    
    // Test Wrong Password
    console.log("3️⃣ Testing Wrong Password...");
    const wrongRes = await makeRequest("/api/auth/login", {
      email: "admin@sofahisofa.com",
      password: "WrongPassword"
    });
    
    if (wrongRes.status === 401) {
      console.log("✅ Wrong password correctly rejected");
    } else {
      console.log("❌ Wrong password check failed");
    }
    console.log();
    
    console.log("🎉 Login tests complete!\n");
    
  } catch (error) {
    console.error("\n❌ Test failed!");
    console.error("Error:", error.message);
  }
}

testLogin();
