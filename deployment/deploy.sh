#!/bin/bash

set -e

# สีสวย ๆ
green="\033[0;32m"
red="\033[0;31m"
reset="\033[0m"

echo -e "${green}🚀 Starting build + version bump + publish...${reset}"


npm version patch


npm run build

# ตรวจสอบว่ามี dist ครบ
echo -e "${green} Verifying build output...${reset}"
find dist -name "*.node.js"

# แพ็กและ publish
echo -e "${green} Publishing to npm...${reset}"
npm publish --access public

# แสดงเวอร์ชันล่าสุด
VERSION=$(node -p "require('./package.json').version")
echo -e "${green}✅ Published version $VERSION to npm!${reset}"
