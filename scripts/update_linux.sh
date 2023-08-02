basePath='.'
rm -rf $basePath/dist/linux-unpacked.zip

cd $basePath/dist/linux-unpacked
zip -1 -r -D ../linux-unpacked.zip  ./

# isContinue='y'
# read -p 'input any exit!' isContinue