// need a .js file so /*@vite-ignore*/ doesn't get stripped by typescript transpiling
export default function (path) {
  console.log("Attempting import from", path)
  return import(/*@vite-ignore*/ path)
}
