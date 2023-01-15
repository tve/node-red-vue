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
  # Build client app (flow editor), output in ./resources/client
  echo "Building vue app"
  (cd client; npm run build)
fi

# Original source: ./client/index.html has links for Vite
# Build step produces ./resources/index.html with links that include file hashes (-9a24e0a7)
# Patching here produces ./node-red-vue.html with correct Node-RED resources links
# That's what gets published to NPM
# After publishing, ./node-red-vue.html is copied to node-red-vue-dist.html and
#   ./node-red-vue-dev.html replaces it
echo "Patching up entry point"
rm -f node-red-vue.html
sed -e 's;"/client;"resources/node-red-vue/client;' \
    -E -e '/(html|head|--)>/d' \
    resources/index.html >node-red-vue.html

echo "Releasing Node-RED-Vue"
v=`npm version patch`
git push
npm publish --tag dev
mv node-red-vue.html node-red-vue-dist.html
cp node-red-vue-dev.html node-red-vue.html
echo RELEASE=$RELEASE
if [[ $RELEASE == 1 ]]; then
  echo "Release-tagging $v with 'latest'"
  npm dist-tag add node-red-vue@$v latest
fi
echo ""
echo "***** Published $v *****"
