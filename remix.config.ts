/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
    serverBuildTarget: "node-cjs", // Tạo file server cho Node.js CommonJS
    ignoredRouteFiles: ["**/.*"],  // Bỏ qua các file ẩn
    serverBuildPath: "build/server/index.js",
    serverModuleFormat: "cjs",
};