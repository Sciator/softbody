import init from "./pkg/softbody.js";

init().then(()=>{
  import("./main.js")
})

