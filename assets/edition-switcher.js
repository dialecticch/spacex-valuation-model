const editionSwitcher = document.querySelector(".edition-switcher");
if(editionSwitcher){
  const trigger = editionSwitcher.querySelector("summary");
  editionSwitcher.addEventListener("pointerenter", (event) => {
    if(event.pointerType === "mouse") editionSwitcher.open = true;
  });
  editionSwitcher.addEventListener("pointerleave", (event) => {
    if(event.pointerType === "mouse" && !editionSwitcher.matches(":focus-within")) editionSwitcher.open = false;
  });
  editionSwitcher.addEventListener("focusout", (event) => {
    if(!editionSwitcher.contains(event.relatedTarget)) editionSwitcher.open = false;
  });
  document.addEventListener("pointerdown", (event) => {
    if(!editionSwitcher.contains(event.target)) editionSwitcher.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if(event.key !== "Escape" || !editionSwitcher.open) return;
    if(editionSwitcher.contains(document.activeElement)) trigger.focus();
    editionSwitcher.open = false;
  });
}
