import https from "https";

const HOSTINGER_API = "https://forestgreen-stinkbug-328327.hostingersite.com";

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const url = new URL(path, HOSTINGER_API);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: data ? "POST" : "GET",
      headers: data ? {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      } : {}
    };

    const req = https.request(options, (res) => {
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
    if (data) req.write(postData);
    req.end();
  });
}

async function testHostinger() {
  console.log("🧪 Testing Hostinger Backend...\n");
  
  try {
    // Test 1: Health Check
    console.log("1️⃣ Testing Health Endpoint...");
    const health = await makeRequest("/api/health");
    if (health.status === 200 && health.data.status === "ok") {
      console.log("✅ Health check: PASS");
    } else {
      console.log("❌ Health check: FAIL", health);
    }
    console.log();
    
    // Test 2: Admin Login
    console.log("2️⃣ Testing Admin Login...");
    const adminLogin = await makeRequest("/api/auth/login", {
      email: "admin@sofahisofa.com",
      password: "Admin@SofaHiSofa2026"
    });
    
    if (adminLogin.status === 200) {
      console.log("✅ Admin login: SUCCESS");
      console.log("   Role:", adminLogin.data.role);
      console.log("   Email:", adminLogin.data.email);
    } else {
      console.log("❌ Admin login: FAIL");
      console.log("   Status:", adminLogin.status);
      console.log("   Response:", adminLogin.data);
    }
    console.log();
    
    // Test 3: SEO Login
    console.log("3️⃣ Testing SEO Login...");
    const seoLogin = await makeRequest("/api/auth/login", {
      email: "seo@sofahisofa.com",
      password: "Seo@SofaHiSofa2026"
    });
    
    if (seoLogin.status === 200) {
      console.log("✅ SEO login: SUCCESS");
      console.log("   Role:", seoLogin.data.role);
      console.log("   Email:", seoLogin.data.email);
    } else {
      console.log("❌ SEO login: FAIL");
      console.log("   Status:", seoLogin.status);
      console.log("   Response:", seoLogin.data);
    }
    console.log();
    
    // Test 4: Wrong Password
    console.log("4️⃣ Testing Wrong Password...");
    const wrongPassword = await makeRequest("/api/auth/login", {
      email: "admin@sofahisofa.com",
      password: "WrongPassword123"
    });
    
    if (wrongPassword.status === 401) {
      console.log("✅ Wrong password correctly rejected");
    } else {
      console.log("❌ Wrong password check failed");
      console.log("   Status:", wrongPassword.status);
    }
    console.log();
    
    // Test 5: Test Registration
    console.log("5️⃣ Testing Registration...");
    const timestamp = Date.now();
    const registration = await makeRequest("/api/auth/register", {
      name: "Test User",
      email: `test${timestamp}@example.com`,
      phone: `98${timestamp.toString().slice(-8)}`,
      password: "Test@123"
    });
    
    if (registration.status === 201) {
      console.log("✅ Registration: SUCCESS");
      console.log("   User:", registration.data.name);
      console.log("   Role:", registration.data.role);
    } else {
      console.log("❌ Registration: FAIL");
      console.log("   Status:", registration.status);
      console.log("   Response:", registration.data);
    }
    console.log();
    
    console.log("🎉 Hostinger Backend Test Complete!\n");
    
  } catch (error) {
    console.error("\n❌ Test Error:", error.message);
  }
}

testHostinger();
