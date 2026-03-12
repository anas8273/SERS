import { describe, expect, it } from "vitest";

/**
 * Tests for the image proxy endpoint added to server/_core/index.ts
 * The proxy is used by pdf-export.ts to bypass CORS restrictions
 * when fetching external images (e.g., MOE logo from CloudFront)
 */

describe("Image Proxy Endpoint", () => {
  const BASE_URL = "http://localhost:3000";

  it("returns 400 when url parameter is missing", async () => {
    const res = await fetch(`${BASE_URL}/api/image-proxy`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing url parameter");
  });

  it("returns 400 when url parameter is empty", async () => {
    const res = await fetch(`${BASE_URL}/api/image-proxy?url=`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing url parameter");
  });

  it("successfully proxies a valid image URL", async () => {
    // Use a well-known public image that should always be available
    const testImageUrl = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png";
    const res = await fetch(`${BASE_URL}/api/image-proxy?url=${encodeURIComponent(testImageUrl)}`);
    expect(res.status).toBe(200);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("image");
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it("proxies CloudFront images that would otherwise fail CORS", async () => {
    const cloudFrontUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663047121386/h34s4aPNVyHXdtjgZ7eNNf/UntiTtled-1-1568x1192_bfb97198.png";
    const res = await fetch(`${BASE_URL}/api/image-proxy?url=${encodeURIComponent(cloudFrontUrl)}`);
    expect(res.status).toBe(200);
    const contentType = res.headers.get("content-type") || "";
    // CloudFront may return application/octet-stream or image/* for PNG files
    expect(["image/png", "application/octet-stream"]).toContain(contentType);
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(100);
  });

  it("sets correct CORS and cache headers", async () => {
    const testImageUrl = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png";
    const res = await fetch(`${BASE_URL}/api/image-proxy?url=${encodeURIComponent(testImageUrl)}`);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toContain("public");
  });

  it("returns error for invalid URL", async () => {
    const res = await fetch(`${BASE_URL}/api/image-proxy?url=${encodeURIComponent("not-a-url")}`);
    // Should return 500 since the URL is invalid
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
