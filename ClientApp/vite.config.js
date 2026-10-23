import{defineConfig}from"vite";import react from"@vitejs/plugin-react";import{resolve}from"path";
export default defineConfig({plugins:[react()],define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{outDir:"../wwwroot/dist",emptyOutDir:true,lib:{entry:resolve(import.meta.dirname,"src.jsx"),formats:["es"],fileName:()=>"cv-app.js"}}});
