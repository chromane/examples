console.log("main");
document.addEventListener("click", () => {
  console.log("main", "click");
});

// override Event.prototype.stopPropagation
let _original = Event.prototype.stopPropagation;
Event.prototype.stopPropagation = function (...args) {
  console.log("stopPropagation", args);
  return _original.apply(this, args);
};
