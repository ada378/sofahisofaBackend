import https from "https";

const DOMAIN = "https://www.thesofahisofa.com";

function testRoute(path) {
  return new Promise((resolve) => {
    const url = new URL(path, DOMAIN);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        resolve({
          path,
          status: res.statusCode,
          contentType: res.headers["content-type"],
          isHTML: res.headers["content-type"]?.includes("text/html"),
          bodyLength: body.length
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        path,
        status: "ERROR",
        error: err.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        path,
        status: "TIMEOUT",
        error: "Request timeout"
      });
    });

    req.end();
  });
}

async function testAllRoutes() {
  console.log("🧪 Testing Domain Routes...\n");
  console.log(`Domain: ${DOMAIN}\n`);

  const routes = [
    "/",
    "/admin/login",
    "/admin/dashboard",
    "/seo/login",
    "/seo",
    "/collections/all",
    "/login",
    "/register"
  ];

  for (const route of routes) {
    const result = await testRoute(route);
    
    if (result.status === "ERROR" || result.status === "TIMEOUT") {
      console.log(`❌ ${route}`);
      console.log(`   Error: ${result.error}\n`);
    } else if (result.status === 200) {
      console.log(`✅ ${route}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Type: ${result.isHTML ? "HTML" : result.contentType}`);
      console.log(`   Size: ${(result.bodyLength / 1024).toFixed(1)}KB\n`);
    } else if (result.status === 404) {
      console.log(`❌ ${route}`);
      console.log(`   Status: 404 Not Found`);
      console.log(`   Type: ${result.contentType}`);
      console.log(`   Issue: Route not accessible - Check routing config\n`);
    } else {
      console.log(`⚠️  ${route}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Type: ${result.contentType}\n`);
    }
  }

  console.log("\n📋 Summary:");
  console.log("If admin/seo routes show 404:");
  console.log("1. Check .htaccess file in public/ folder");
  console.log("2. Check _redirects file for Netlify/Vercel");
  console.log("3. Ensure frontend is built with latest changes");
  console.log("4. Check server routing configuration\n");
}

testAllRoutes();
