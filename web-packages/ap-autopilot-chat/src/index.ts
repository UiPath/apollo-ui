// Autopilot Chat Web Component

class ApAutopilotChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: Inter, system-ui, -apple-system, sans-serif;
          }
        </style>
        <div>
          <p>Autopilot Chat Component</p>
        </div>
      `;
    }
  }
}

// Define custom element
if (!customElements.get('ap-autopilot-chat')) {
  customElements.define('ap-autopilot-chat', ApAutopilotChat);
}

export { ApAutopilotChat };
