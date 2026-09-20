import fs from "fs";
import path from "path";
import cloudinary from "cloudinary";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Category mapping
const categoryMap = {
  chair: "chair",
  sofa: "sofa",
  bed: "bed",
  dining: "dining-table",
  table: "dining-table",
};

function extractCategory(filename) {
  const lower = filename.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lower.includes(key)) return value;
  }
  return "furniture";
}

function extractProductName(filename) {
  const namePart = filename
    .replace(/Lucknow/gi, "")
    .replace(/Sofahisofa/gi, "")
    .replace(/Sofa/gi, "")
    .replace(/hi/gi, "")
    .replace(/from/gi, "")
    .replace(/\(\d+\)/g, "")
    .trim();
  return namePart.substring(0, 50) || "Premium Furniture";
}

function generateDescription(productName, category) {
  const descriptions = {
    sofa: `Premium handcrafted ${productName} with solid wood frame and high-resilience foam. Built for everyday Indian living rooms with comfort and durability. Features elegant design with 10-year frame warranty and free pan-India delivery.`,
    chair: `Elegant ${productName} perfect for any room setting. Crafted with premium materials and solid wood construction. Designed for comfort and style with expert craftsmanship. Backed by 10-year warranty.`,
    bed: `Luxury ${productName} featuring solid wood construction with premium mattress support. Architectural design with superior comfort. Perfect for modern Indian bedrooms with lifetime termite guarantee.`,
    "dining-table": `Modern ${productName} combining functionality with elegant design. Crafted from premium materials with sturdy construction. Perfect for family gatherings with easy maintenance and 10-year warranty.`,
    furniture: `Premium ${productName} featuring expert craftsmanship and high-quality materials. Designed for comfort, durability, and style. 10-year warranty with free delivery across India.`,
  };
  return descriptions[category] || descriptions.furniture;
}

function generateShortDescription(productName, category) {
  const prefixes = {
    sofa: `Premium ${productName} with solid wood frame`,
    chair: `Elegant ${productName} for any room`,
    bed: `Luxury ${productName} with premium comfort`,
    "dining-table": `Modern ${productName} for family dining`,
    furniture: `Premium ${productName} with quality craftsmanship`,
  };
  return prefixes[category] || prefixes.furniture;
}

function generateSeoTitle(productName, category) {
  return `${productName} | Premium ${category.charAt(0).toUpperCase() + category.slice(1)} Online | Sofa Hi Sofa`;
}

function generateSeoDescription(productName, category) {
  const descriptions = {
    sofa: `Buy premium ${productName} online. Solid wood frame, 10-year warranty, free delivery. Direct from factory, 100+ fabric choices.`,
    chair: `Shop elegant ${productName}. Premium crafted chair with warranty. Best prices, free delivery all over India.`,
    bed: `Luxury ${productName} online at best price. Solid wood construction, lifetime guarantee, free installation.`,
    "dining-table": `Modern ${productName} for your dining room. Premium materials, sturdy design, lifetime warranty.`,
    furniture: `Buy premium ${productName} online. Best quality, warranty, free delivery across India.`,
  };
  return descriptions[category] || descriptions.furniture;
}

// Store upload progress in memory
const uploadProgress = {};

export const processFolderPhotos = async (req, res) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ message: "Folder path required" });
  }

  // Check if folder exists
  if (!fs.existsSync(folderPath)) {
    return res.status(400).json({ message: "Folder not found" });
  }

  const sessionId = `upload_${Date.now()}`;
  uploadProgress[sessionId] = {
    status: "processing",
    totalFiles: 0,
    processedFiles: 0,
    uploadedImages: 0,
    products: [],
    errors: [],
  };

  res.json({ sessionId, message: "Processing started in background" });

  // Process in background
  (async () => {
    try {
      const files = fs.readdirSync(folderPath).filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
      });

      uploadProgress[sessionId].totalFiles = files.length;

      // Group by product
      const productGroups = {};
      files.forEach((file) => {
        const category = extractCategory(file);
        const productName = extractProductName(file);
        const key = `${category}_${productName}`;

        if (!productGroups[key]) {
          productGroups[key] = {
            name: productName,
            category: category,
            files: [],
          };
        }
        productGroups[key].files.push(file);
      });

      // Process each product
      let productCount = 0;
      for (const [key, group] of Object.entries(productGroups)) {
        const images = [];

        for (const file of group.files) {
          const filePath = path.join(folderPath, file);

          try {
            const result = await cloudinary.v2.uploader.upload(filePath, {
              folder: `sofa-hi-sofa/${group.category}`,
              resource_type: "auto",
              quality: "auto",
            });

            images.push({
              url: result.secure_url,
              alt: `${group.name} - View ${images.length + 1}`,
            });

            uploadProgress[sessionId].uploadedImages++;
            uploadProgress[sessionId].processedFiles++;
          } catch (err) {
            uploadProgress[sessionId].errors.push({
              file,
              error: err.message,
            });
            uploadProgress[sessionId].processedFiles++;
          }
        }

        if (images.length > 0) {
          // Get or create category
          let categoryId = null;
          try {
            let cat = await Category.findOne({ slug: group.category });
            if (!cat) {
              cat = await Category.create({
                name: group.category.charAt(0).toUpperCase() + group.category.slice(1),
                slug: group.category,
              });
            }
            categoryId = cat._id;
          } catch (err) {
            uploadProgress[sessionId].errors.push({
              product: group.name,
              error: `Category creation failed: ${err.message}`,
            });
          }

          const product = {
            name: group.name,
            sku: `SHS-${group.category.toUpperCase()}-${String(productCount + 1).padStart(3, "0")}`,
            category: categoryId,
            subCategory: `${group.category.charAt(0).toUpperCase() + group.category.slice(1)} Collection`,
            price: 24999,
            marketPrice: 39999,
            stock: 5,
            description: generateDescription(group.name, group.category),
            shortDescription: generateShortDescription(group.name, group.category),
            material: "Premium Materials with Solid Wood Frame",
            warranty: "10 Year Frame Warranty",
            images: images,
            isFeatured: true,
            isBestSeller: false,
            isNewLaunch: true,
            fabricOptions: [
              { name: "Natural Brown", hex: "#8B6914" },
              { name: "Charcoal Black", hex: "#2C3E50" },
            ],
            metaTitle: generateSeoTitle(group.name, group.category),
            metaDescription: generateSeoDescription(group.name, group.category),
            metaKeywords: [
              group.name,
              group.category,
              "buy online",
              "sofa hi sofa",
              "free delivery",
              "warranty",
            ],
          };

          uploadProgress[sessionId].products.push(product);
          productCount++;
        }
      }

      // Save to database
      const createdProducts = await Product.insertMany(uploadProgress[sessionId].products);

      uploadProgress[sessionId].status = "completed";
      uploadProgress[sessionId].message = `Successfully created ${createdProducts.length} products with ${uploadProgress[sessionId].uploadedImages} images`;
    } catch (err) {
      uploadProgress[sessionId].status = "error";
      uploadProgress[sessionId].error = err.message;
    }
  })();
};

export const getUploadProgress = async (req, res) => {
  const { sessionId } = req.params;

  if (!uploadProgress[sessionId]) {
    return res.status(404).json({ message: "Session not found" });
  }

  res.json(uploadProgress[sessionId]);
};

export const getUploadedJSON = async (req, res) => {
  const { sessionId } = req.params;

  if (!uploadProgress[sessionId]) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (uploadProgress[sessionId].status !== "completed") {
    return res.status(400).json({ message: "Upload still processing" });
  }

  res.json(uploadProgress[sessionId].products);
};

// Upload files directly from browser
export const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Filter only image files
    const imageFiles = req.files.filter((file) => {
      const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      return validImageTypes.includes(file.mimetype);
    });

    if (imageFiles.length === 0) {
      return res.status(400).json({ message: "No valid image files found. Supported: jpg, png, webp" });
    }

    const sessionId = `upload_${Date.now()}`;
    const folderName = req.body.folderName || "imported";

    uploadProgress[sessionId] = {
      status: "processing",
      totalFiles: imageFiles.length,
      processedFiles: 0,
      uploadedImages: 0,
      products: [],
      errors: [],
    };

    res.json({ 
      sessionId, 
      message: `Processing ${imageFiles.length} image files in background`,
      skippedFiles: req.files.length - imageFiles.length,
    });

    // Process in background
    (async () => {
      try {
        // Group files by detected product type
        const productGroups = {};

        for (const file of imageFiles) {
          const filename = file.originalname;
          const category = extractCategory(filename);
          const productName = extractProductName(filename);
          const key = `${category}_${productName}`;

          if (!productGroups[key]) {
            productGroups[key] = {
              name: productName,
              category: category,
              files: [],
            };
          }

          productGroups[key].files.push(file);
        }

        // Process each product group
        let productCount = 0;
        for (const [key, group] of Object.entries(productGroups)) {
          const images = [];

          for (const file of group.files) {
            try {
              // Upload to Cloudinary from buffer with retry logic
              let uploadResult = null;
              let retries = 3;
              
              while (retries > 0 && !uploadResult) {
                try {
                  uploadResult = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.v2.uploader.upload_stream(
                      {
                        folder: `sofa-hi-sofa/${group.category}`,
                        resource_type: "auto",
                        quality: "auto",
                      },
                      (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                      }
                    );

                    uploadStream.end(file.buffer);
                  });
                } catch (err) {
                  retries--;
                  if (retries > 0) {
                    // Wait before retry (exponential backoff)
                    await new Promise(r => setTimeout(r, 2000 * (4 - retries)));
                  } else {
                    throw err;
                  }
                }
              }

              images.push({
                url: uploadResult.secure_url,
                alt: `${group.name} - View ${images.length + 1}`,
              });

              uploadProgress[sessionId].uploadedImages++;
              uploadProgress[sessionId].processedFiles++;
              
              // Add small delay between uploads to avoid rate limiting
              await new Promise(r => setTimeout(r, 300));
            } catch (err) {
              uploadProgress[sessionId].errors.push({
                file: file.originalname,
                error: err.message || "Upload failed",
              });
              uploadProgress[sessionId].processedFiles++;
            }
          }

          if (images.length > 0) {
            // Get or create category
            let categoryId = null;
            try {
              let cat = await Category.findOne({ slug: group.category });
              if (!cat) {
                cat = await Category.create({
                  name: group.category.charAt(0).toUpperCase() + group.category.slice(1),
                  slug: group.category,
                });
              }
              categoryId = cat._id;
            } catch (err) {
              uploadProgress[sessionId].errors.push({
                product: group.name,
                error: `Category creation failed: ${err.message}`,
              });
            }

            const product = {
              name: group.name,
              sku: `SHS-${group.category.toUpperCase()}-${String(productCount + 1).padStart(3, "0")}`,
              category: categoryId,
              subCategory: `${group.category.charAt(0).toUpperCase() + group.category.slice(1)} Collection`,
              price: 24999,
              marketPrice: 39999,
              stock: 5,
              description: generateDescription(group.name, group.category),
              shortDescription: generateShortDescription(group.name, group.category),
              material: "Premium Materials with Solid Wood Frame",
              warranty: "10 Year Frame Warranty",
              images: images,
              isFeatured: true,
              isBestSeller: false,
              isNewLaunch: true,
              fabricOptions: [
                "Natural Brown",
                "Charcoal Black",
              ],
              metaTitle: generateSeoTitle(group.name, group.category),
              metaDescription: generateSeoDescription(group.name, group.category),
              metaKeywords: [
                group.name,
                group.category,
                "buy online",
                "sofa hi sofa",
                "free delivery",
                "warranty",
              ],
            };

            uploadProgress[sessionId].products.push(product);
            productCount++;
          }
        }

        // Save to database
        const createdProducts = await Product.insertMany(uploadProgress[sessionId].products);

        uploadProgress[sessionId].status = "completed";
        uploadProgress[sessionId].message = `Successfully created ${createdProducts.length} products with ${uploadProgress[sessionId].uploadedImages} images`;
      } catch (err) {
        uploadProgress[sessionId].status = "error";
        uploadProgress[sessionId].error = err.message;
      }
    })();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
