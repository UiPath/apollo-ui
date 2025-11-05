// Data Grid Web Component

class ApDataGrid extends HTMLElement {
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
          table {
            width: 100%;
            border-collapse: collapse;
          }
        </style>
        <div>
          <p>Data Grid Component</p>
          <table>
            <thead>
              <tr>
                <th>Column 1</th>
                <th>Column 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }
  }
}

// Define custom element
if (!customElements.get('ap-data-grid')) {
  customElements.define('ap-data-grid', ApDataGrid);
}

export { ApDataGrid };
