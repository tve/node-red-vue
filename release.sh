#! /bin/bash -e

# read commandline options
RELEASE=0
FDV=
while getopts ":hrs" opt; do
  case $opt in
    h)
      echo "Usage: $0 [-h] [-r]"
      echo " -h show this help message and exit"
      echo " -r release the version (else dev channel)"
      echo " -s skip client build"
      exit 0
      ;;
    r)
      RELEASE=1
      ;;
    s)
      SKIP=1
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

if ! [[ $SKIP == 1 ]]; then
  echo "Building vue app"
  (cd client; npm run build)
fi

echo "Patching up entry point"
rm -f node-red-vue.html
sed -e 's;"/client;"/resources/node-red-vue/client;' \
    resources/index.html >node-red-vue.html

echo "Releasing Node-RED-Vue"
npm version patch
git push
npm publish --tag dev
mv node-red-vue.html node-red-vue-dist.html
ln -s node-red-vue-dev.html node-red-vue.html
echo RELEASE=$RELEASE
if [[ $RELEASE == 1 ]]; then
  echo "Release-tagging $v with 'latest'"
  npm dist-tag add node-red-vue@$v latest
fi
echo ""
echo "***** Published $v *****"
