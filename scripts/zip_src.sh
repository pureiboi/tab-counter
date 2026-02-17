rm -rf build/source.zip
zip -r build/source.zip . -x "node_modules/*" "dist/*" "build/*" ".git/*" ".idea/*" ".github/*"
