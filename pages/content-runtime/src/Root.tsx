export function mount() {
  let root = document.getElementById('runtime-content-view-root');

  if (root) {
    // ✅ If already exists, toggle modal
    document.dispatchEvent(new CustomEvent('toggle-modal'));
    return;
  }

  // 🔹 If no shadow root, create one
  // root = document.createElement("div");
  // root.id = "runtime-content-view-root";
  // document.body.append(root);

  // const shadowRoot = root.attachShadow({ mode: "open" });

  // const styleElement = document.createElement("style");
  // styleElement.innerHTML = injectedStyle;
  // shadowRoot.appendChild(styleElement);

  // const rootIntoShadow = document.createElement("div");
  // rootIntoShadow.id = "shadow-root";
  // shadowRoot.appendChild(rootIntoShadow);

  // injectReact(<App />, rootIntoShadow);
}
