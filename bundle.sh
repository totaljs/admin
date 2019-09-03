mkdir -p .bundle/

cd .bundle
cp -a ../controllers/ controllers
cp -a ../definitions/ definitions
cp -a ../schemas/ schemas
cp -a ../modules/ modules
cp -a ../public/ public
cp -a ../plugins/ plugins
cp -a ../resources/ resources
cp -a ../views/ views

totaljs bundle ../admin.bundle

cd ..
rm -rf .bundle
echo "DONE"