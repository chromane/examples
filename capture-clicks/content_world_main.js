function log_click(click_target) {
  console.log("click", click_target);
}
// normal event listener
document.addEventListener("click", (event) => {
  log_click(event.target);
});
// override stopPropagation
let _original_stopPropagation = Event.prototype.stopPropagation;
Event.prototype.stopPropagation = function (...args) {
  log_click(this.target);
  return _original_stopPropagation.apply(this, args);
};
