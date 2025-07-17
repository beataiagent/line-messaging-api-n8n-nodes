#!/bin/bash
set -e

green="\033[0;32m"
red="\033[0;31m"
reset="\033[0m"

echo -e "$Starting build + version bump + publish...${reset}"

if [[ -n $(git status --porcelain) ]]; then
  echo -e "${red}❌ Git working directory not clean. Please commit or stash your changes first.${reset}"
  git status --short
  exit 1
fi

npm version patch --force


npm run build

echo -e "${green}📦 Build complete. Verifying dist...${reset}"
find dist -name "*.node.js"


read -p $'\n🔐 Do you want to publish this version to npm? (y/n): ' confirm

if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
  echo -e "${green}📤 Publishing to npm...${reset}"
  npm publish --access public

  VERSION=$(node -p "require('./package.json').version")
  echo -e "${green}✅ Published version $VERSION to npm!${reset}"
else
  echo -e "${red}🚫 Publish canceled.${reset}"
fi