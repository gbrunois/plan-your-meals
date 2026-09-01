# How to troubleshoot frontend installation issues on Node 18+

This guide describes how to resolve common installation and runtime errors in the frontend package when using Node 18 or newer.

## Problem
You encounter errors during `npm install` related to `node-sass`, or the development server fails to start with an `ERR_OSSL_EVP_UNSUPPORTED` error.

## Steps

### 1. Resolve `node-sass` installation failures
`node-sass` is incompatible with Node 18. Since the project uses `sass` (Dart Sass), `node-sass` is redundant.

1. Open `packages/front/package.json`.
2. Remove `"node-sass": "^4.14.1"` from `devDependencies`.
3. Save the file.

### 2. Enable OpenSSL Legacy Provider
Older versions of Webpack/Vue CLI rely on cryptographic algorithms that are restricted in Node 18's OpenSSL 3 implementation.

1. In `packages/front/package.json`, update the following scripts:
   ```json
   "scripts": {
     "serve": "NODE_OPTIONS=--openssl-legacy-provider vue-cli-service serve",
     "build": "NODE_OPTIONS=--openssl-legacy-provider vue-cli-service build",
     "test": "NODE_OPTIONS=--openssl-legacy-provider vue-cli-service test:unit"
   }
   ```
2. Save the file.

### 3. Re-install dependencies
Run the installation command in the frontend package:

```bash
cd packages/front
npm install --legacy-peer-deps
```

## Verification
To verify the fix, start the development server:

```bash
npm run serve
```
The application should compile successfully and be accessible at `http://localhost:8080/`.

---

## Explanation
- **node-sass vs sass**: `node-sass` is a wrapper around LibSass (written in C++), which requires native compilation and is highly sensitive to Node versions. `sass` (Dart Sass) is the official successor and runs in pure JavaScript, making it cross-platform and version-agnostic.
- **OpenSSL 3**: Node 17 introduced OpenSSL 3 by default. Many older build tools (Webpack 4, etc.) use algorithms that are now considered "legacy". The `NODE_OPTIONS=--openssl-legacy-provider` flag explicitly allows the use of these legacy algorithms for compatibility.
